import { Worker, Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import AWS from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import { processLogFile } from "../parsers/logParser.js";
import Redis from "ioredis";

dotenv.config();
const prisma = new PrismaClient();
const redisPublisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

// Initialize PostgreSQL Queue
const postgresQueue = new Queue("postgres-save-queue", {
  connection: redisConnection,
});

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

/**
 * Saves structured log data to Redis
 * @param {String} userId - User ID
 * @param {String} logId - Unique log ID
 * @param {Object} fightsData - Structured fights object
 */
async function saveToRedis(userId, logId, fightsData) {
  try {
    const key = `log:${userId}:${logId}`;
    await redisConnection.setex(key, 3600, JSON.stringify(fightsData)); // Expires in 1 hour
    await redisConnection.set(`log:${userId}:latest`, logId);
    console.log(` Log saved in Redis: ${key}`);

    // ✅ Update processingStatus to "completed" after saving to Redis
    await prisma.logs.update({
      where: { logId },
      data: {
        processingStatus: "completed",
        structuredDataPath: `logs/json/log-${logId}.json`, // Store structured log path
        processedAt: new Date(), // Timestamp for completion
      },
    });
  } catch (error) {
    console.error(" Redis save error:", error);
  }
}

// ✅ NEW: Cache logInstances with name list in Redis
/**
 * Saves all structured log data to Redis cache to send the logInstances to the user for them to select the log which needs to be uplaoded to db
 * @param {String} userId - User ID
 * @param {String} logId - Unique log ID
 * @param {Object} fightsData - Structured fights object
 */
// async function cacheInstancesInRedis(logId, logInstances) {
//   try {
//     const redisKey = `log:${logId}:instances`;

//     // Store full structured fights
//     await redisConnection.setex(
//       redisKey,
//       900, // 15 minutes
//       JSON.stringify(logInstances)
//     );

//     // Update DB status
//     await prisma.logs.update({
//       where: { logId },
//       data: {
//         processingStatus: "awaiting_user_choice",
//         processedAt: new Date(),
//       },
//     });

//     // Send instance names to client via Redis PubSub
//     const instanceNames = logInstances.map((i) => i.name);

//     await redisPublisher.publish(
//       `log:${logId}`,
//       JSON.stringify({
//         stage: "awaiting_selection",
//         progress: 100,
//         instanceNames,
//       })
//     );

//     console.log(`📦 Cached ${logInstances.length} logInstances to Redis`);
//   } catch (error) {
//     console.error("❌ Error caching instances in Redis:", error);
//   }
// }

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
      const filePath = path.join(cacheDir, `instance-${i}.json`);
      fs.writeFileSync(filePath, JSON.stringify(instance));
      instancePaths.push(filePath);
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
          const structuredFights = await processLogFile(filePath, logId);

          // io.emit(`log:${logId}`, { stage: "parsing", progress: 50 });
          publishProgress(logId, "parsing", 50);

          console.log(` Log parsing completed for log ID: ${logId}`);

          //setting up the parsed structured fights in DB
          // if (structuredFights) {
          //   console.log(`🔹 Storing log in Redis for quick access...`);

          //   console.log(logId);
          //   // await saveToRedis(userId, logId, structuredFights);
          //   // Run saveToRedis and PostgreSQL job simultaneously
          //   await Promise.all([
          //     // saveToRedis(userId, logId, structuredFights), // Save to Redis
          //     postgresQueue.add("save-to-postgres", {
          //       logId,
          //       structuredFights,
          //     }), // Save to PostgreSQL
          //   ]);

          //   publishProgress(logId, "saving", 10);
          // }

          // sending cached instances from redis to user for user selection
          if (structuredFights && Array.isArray(structuredFights)) {
            console.log(`🔹 Caching structured fights (multiple instances)...`);
            await cacheInstancePointersToRedis(logId, structuredFights);
          }
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
