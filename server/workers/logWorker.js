import { Worker, Queue, QueueEvents } from "bullmq";
import { redisConnection } from "../config/redis.js";
import AWS from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
// import { processLogFile } from "../parsers/logParser.js";
import Redis from "ioredis";
import { generateAttemptSegments } from "./attemptSegmentWorker.js";
import {
  damageHealQueue,
  damageHealQueueEvents,
} from "../queues/damageHealQueue.js";
import { petQueue, petQueueEvents } from "../queues/petQueue.js";

dotenv.config();
const prisma = new PrismaClient();
const redisPublisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

// ✅ Function to Publish Events to Redis Instead of Emitting Directly
const publishProgress = async (logId, stage, progress) => {
  const message = JSON.stringify({ stage, progress });
  console.log(
    `🚀 Publishing progress update to Redis: log:${logId} - ${stage} (${progress}%)`
  );
  await redisPublisher.publish(`log:${logId}`, message);
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1",
});

//  Define __dirname manually for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NEW: Cache logInstances with name list in Redis
/**
 * Saves all structured log data to Redis cache to send the logInstances to the user for them to select the log which needs to be uplaoded to db
 * @param {String} userId - User ID
 * @param {String} logId - Unique log ID
 * @param {Object} fightsData - Structured fights object
 */

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

    for (let i = 0; i < logInstances.length; i++) {
      const instance = logInstances[i];
      if (!instance.encounterStartTime) {
        console.warn(
          "⚠️ Encounter start time missing for instance:",
          instance.name
        );
      }
      const filePath = path.join(cacheDir, `instance-${i}.json`);
      fs.writeFileSync(filePath, JSON.stringify(instance));
      instancePaths.push(filePath);

      console.log("🧪 Instance written:", {
        name: instance.name,
        encounterStartTime: instance.encounterStartTime,
        keys: Object.keys(instance),
      });
    }

    const redisKey = `log:${logId}:instances`;
    await redisConnection.setex(
      redisKey,
      900,
      JSON.stringify({ instanceNames, instancePaths })
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
        progress: 100,
        instanceNames,
      })
    );

    console.log(`📦 Stored ${logInstances.length} instance pointers in Redis`);
  } catch (err) {
    console.error("❌ Failed to cache instance pointers:", err.message);
  }
}

const logWorker = new Worker(
  "log-processing-queue",
  async (job) => {
    try {
      const { logId, s3FilePath } = job.data;
      console.log(` Processing log (ID: ${logId})...`);

      process.env.WORKER = "true";
      publishProgress(logId, "fetching", 10);
      console.log(` Fetching file from S3: ${s3FilePath}`);
      const userId = "12345";

      const urlObj = new URL(s3FilePath);
      const s3ObjectKey = urlObj.pathname.substring(1);

      //  Fetch the log file from S3
      //   const s3ObjectKey = s3FilePath.split(".com/")[1]; // Extract object key
      console.log(` Extracted S3 Object Key: ${s3ObjectKey}`);
      const zipFile = await s3
        .getObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: s3ObjectKey })
        .promise();

      if (!zipFile.Body) {
        throw new Error("Log file is empty or inaccessible");
      }

      publishProgress(logId, "unzip", 20);

      console.log(` Successfully fetched file from S3`);

      //  Ensure the /tmp/ directory exists (Cross-platform fix)
      const tempDir = path.join(__dirname, "..", "tmp"); // Windows & Linux compatible
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      //  Write file to tmp directory
      const tempZipPath = path.join(tempDir, `log-${logId}.zip`);
      fs.writeFileSync(tempZipPath, zipFile.Body);

      publishProgress(logId, "unzip", 50);
      console.log(` .zip file saved locally: ${tempZipPath}`);

      //  Extract .zip file
      const extractPath = path.join(tempDir, `log-${logId}`);
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath);
      }

      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(extractPath, true);

      publishProgress(logId, "unzip", 100);
      console.log(` Extracted files to: ${extractPath}`);

      //  Iterate over extracted files
      const extractedFiles = fs.readdirSync(extractPath);
      console.log(` Found ${extractedFiles.length} log files in .zip`);

      publishProgress(logId, "parsing", 10);

      for (const fileName of extractedFiles) {
        const filePath = path.join(extractPath, fileName);

        //  Ensure it's a text file before processing
        if (fileName.endsWith(".txt")) {
          console.log(` Processing extracted file: ${fileName}`);

          //  Parse the log file and structure encounters
          // const structuredFights = await processLogFile(filePath, logId);

          // io.emit(`log:${logId}`, { stage: "parsing", progress: 50 });
          publishProgress(logId, "parsing", 20);

          console.log(` Log parsing completed for log ID: ${logId}`);

          // 1. Generate segmented attempts and save as JSON
          const attemptOutputPath = path.join(extractPath, `attempts.json`);
          // await generateAttemptSegments(filePath, logId, attemptOutputPath);
          const structuredLogInstances = await generateAttemptSegments(
            filePath,
            logId,
            attemptOutputPath
          );
          // console.log(structuredLogInstances);

          const petJob = await petQueue.add("parse-pets", {
            logId,
            filePath, // full path to .txt
          });
          publishProgress(logId, "segmentation", 30);
          console.log(`✅ Generated segmented attempts for ${logId}`);

          const damageHealJob = await damageHealQueue.add("parse-damage-heal", {
            logId,
            attemptsPath: attemptOutputPath,
          });

          await damageHealJob.waitUntilFinished(damageHealQueueEvents);
          publishProgress(logId, "parsing", 50);
          console.log(`✅ Log parsing completed for log ID: ${logId}`);

          // sending cached instances from redis to user for user selection
          if (structuredLogInstances && Array.isArray(structuredLogInstances)) {
            console.log(`🔹 Caching structured fights (multiple instances)...`);
            await petJob.waitUntilFinished(petQueueEvents);
            await cacheInstancePointersToRedis(logId, structuredLogInstances);
          }
          // fs.unlinkSync(tempZipPath);
        } else {
          throw new Error(
            ` Invalid file detected: ${fileName}. Only .txt or .log files are allowed.`
          );
        }
      }

      // io.emit(`log:${logId}`, { stage: "completed", progress: 100 });
      publishProgress(logId, "completed", 100);
      console.log(` Processing completed for log ID: ${logId}`);

      //  Cleanup: Delete extracted files and zip
      fs.unlinkSync(tempZipPath);
      fs.rmSync(extractPath, { recursive: true, force: true });

      console.log(` Cleaned up temp files.`);
    } catch (error) {
      console.error(" Error processing log:", error.message);

      await prisma.logs.update({
        where: { logId: job.data.logId },
        data: { processingStatus: "failed" },
      });

      //Emit error event
      publishProgress(job.data.logId, "error", error.message);
    }
  },
  { connection: redisConnection }
);

console.log(" Log processing worker started...");

export default logWorker;
