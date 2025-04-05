import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import AWS from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import Redis from "ioredis";
import { detectInstances } from "../utils/detectInstances.js";

dotenv.config();

const prisma = new PrismaClient();
const redisPublisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1",
  httpOptions: {
    timeout: 10000,
    connectTimeout: 3000,
  },
  maxRetries: 1,
});

const publishProgress = async (logId, stage, progress) => {
  const message = JSON.stringify({ stage, progress });
  console.log(`🚀 Publishing to Redis: log:${logId} - ${stage} (${progress}%)`);
  await redisPublisher.publish(`log:${logId}`, message);
};

async function cacheInstancePointersToRedis(logId, logInstances) {
  try {
    const instanceNames = logInstances.map((i) => i.name);
    const cacheDir = path.join(
      __dirname,
      "..",
      "tmp",
      "cached-instances",
      `log-${logId}`
    );
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const instancePaths = [];

    await Promise.all(
      logInstances.map((instance, i) => {
        const filePath = path.join(cacheDir, `instance-${i}.json`);
        instancePaths.push(filePath);
        return fs.promises.writeFile(
          filePath,
          JSON.stringify(instance, null, 2)
        );
      })
    );

    await redisConnection.setex(
      `log:${logId}:instances`,
      900,
      JSON.stringify({ instanceNames, instancePaths, instances: logInstances })
    );

    await prisma.logs.update({
      where: { logId },
      data: {
        processingStatus: "awaiting_user_choice",
        processedAt: new Date(),
      },
    });

    await redisPublisher.publish(
      `log:${logId}`,
      JSON.stringify({
        stage: "awaiting_selection",
        progress: 20,
        instanceNames,
      })
    );

    console.log(
      `📦 Cached ${logInstances.length} log instances for logId ${logId}`
    );
  } catch (err) {
    console.error("❌ Failed to cache instances to Redis:", err.message);
  }
}

const logWorker = new Worker(
  "log-processing-queue",
  async (job) => {
    const { logId, s3FilePath } = job.data;
    console.log(`✅ Starting log processing for ID: ${logId}`);
    process.env.WORKER = "true";

    try {
      publishProgress(logId, "fetching uploaded log", 5);

      const urlObj = new URL(s3FilePath);
      const s3ObjectKey = urlObj.pathname.substring(1);
      const tempDir = path.join(__dirname, "..", "tmp");

      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempZipPath = path.join(tempDir, `log-${logId}.zip`);
      const extractPath = path.join(tempDir, `log-${logId}`);
      const writeStream = fs.createWriteStream(tempZipPath);

      console.log(`⬇️ Downloading from S3: ${s3ObjectKey}`);
      await new Promise((resolve, reject) => {
        s3.getObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: s3ObjectKey })
          .createReadStream()
          .on("error", reject)
          .on("end", resolve)
          .pipe(writeStream);
      });

      publishProgress(logId, "unzipping log", 10);
      if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath);

      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(extractPath, true);
      console.log(`📂 Extracted zip to ${extractPath}`);

      const extractedFiles = fs.readdirSync(extractPath);
      console.log(`📄 Found ${extractedFiles.length} files in zip`);

      publishProgress(logId, "slicing to log instances", 15);

      for (const fileName of extractedFiles) {
        const filePath = path.join(extractPath, fileName);

        if (!fileName.endsWith(".txt")) {
          throw new Error(`Invalid file: ${fileName}. Expected .txt or .log`);
        }

        const logInstances = await detectInstances(filePath);
        console.log(
          `🔍 Detected ${logInstances.length} instance(s) from ${fileName}`
        );

        await cacheInstancePointersToRedis(logId, logInstances);
      }

      console.log(
        `🧼 Done processing and caching instances for logId ${logId}`
      );
    } catch (error) {
      console.error("❌ Error processing log:", error.message);
      fs.writeFileSync(
        `/tmp/log-${logId}-error.json`,
        JSON.stringify({ error: error.message })
      );

      await prisma.logs.update({
        where: { logId },
        data: { processingStatus: "failed" },
      });

      publishProgress(logId, "error", error.message);
    }
  },
  { connection: redisConnection }
);

console.log("🚀 Log processing worker started...");
export default logWorker;
