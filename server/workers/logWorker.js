// import { Worker } from "bullmq";
// import { redisConnection } from "../config/redis.js";
// import AWS from "aws-sdk";
// import fs from "fs";
// import dotenv from "dotenv";
// import path from "path";
// import { PrismaClient } from "@prisma/client";
// import { fileURLToPath } from "url";
// import AdmZip from "adm-zip";
// import Redis from "ioredis";
// // import { generateAttemptSegments } from "./newAttemptSegmentWorker.js";
// import { generateAttemptSegments } from "./generateAttemptsV3.js";
// // import { generateAttemptSegments } from "./attemptSegmentWorker.js";

// import {
//   damageHealQueue,
//   damageHealQueueEvents,
// } from "../queues/damageHealQueue.js";
// import { petQueue, petQueueEvents } from "../queues/petQueue.js";

// dotenv.config();
// const prisma = new PrismaClient();
// const redisPublisher = new Redis(
//   process.env.REDIS_URL || "redis://localhost:6379"
// );

// const publishProgress = async (logId, stage, progress) => {
//   const message = JSON.stringify({ stage, progress });
//   console.log(
//     `🚀 Publishing progress update to Redis: log:${logId} - ${stage} (${progress}%)`
//   );
//   await redisPublisher.publish(`log:${logId}`, message);
// };

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: "ap-south-1",
//   httpOptions: {
//     timeout: 10000,
//     connectTimeout: 3000,
//   },
//   maxRetries: 1,
// });

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// async function cacheInstancePointersToRedis(logId, logInstances) {
//   try {
//     const instanceNames = logInstances.map((i) => i.name);

//     const cacheDir = path.join(
//       __dirname,
//       "..",
//       "tmp",
//       "cached-instances",
//       `log-${logId}`
//     );
//     if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

//     const instancePaths = [];

//     // 🔁 Convert writeFileSync to parallel async writes
//     const writePromises = logInstances.map((instance, i) => {
//       const filePath = path.join(cacheDir, `instance-${i}.json`);
//       instancePaths.push(filePath);
//       return fs.promises.writeFile(filePath, JSON.stringify(instance, null, 2));
//     });

//     await Promise.all(writePromises); // ✅ Wait for all writes in parallel

//     await redisConnection.setex(
//       `log:${logId}:instances`,
//       900,
//       JSON.stringify({ instanceNames, instancePaths })
//     );

//     await prisma.logs.update({
//       where: { logId },
//       data: {
//         processingStatus: "awaiting_user_choice",
//         processedAt: new Date(),
//       },
//     });

//     await redisPublisher.publish(
//       `log:${logId}`,
//       JSON.stringify({
//         stage: "awaiting_selection",
//         progress: 100,
//         instanceNames,
//       })
//     );

//     console.log(`📦 Stored ${logInstances.length} instance pointers in Redis`);
//   } catch (err) {
//     console.error("❌ Failed to cache instance pointers:", err.message);
//   }
// }

// const logWorker = new Worker(
//   "log-processing-queue",
//   async (job) => {
//     try {
//       const { logId, s3FilePath } = job.data;
//       console.log(` Processing log (ID: ${logId})...`);
//       process.env.WORKER = "true";

//       publishProgress(logId, "fetching", 10);
//       const urlObj = new URL(s3FilePath);
//       const s3ObjectKey = urlObj.pathname.substring(1);

//       console.log(` Extracted S3 Object Key: ${s3ObjectKey}`);
//       console.log("📦 Downloading from S3...");
//       console.time("S3 Download");

//       const tempDir = path.join(__dirname, "..", "tmp");
//       if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

//       const tempZipPath = path.join(tempDir, `log-${logId}.zip`);
//       const writeStream = fs.createWriteStream(tempZipPath);

//       await new Promise((resolve, reject) => {
//         s3.getObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: s3ObjectKey })
//           .createReadStream()
//           .on("error", (err) => reject(err))
//           .on("end", () => resolve())
//           .pipe(writeStream);
//       });

//       console.timeEnd("S3 Download");
//       console.log(`📦 Downloaded and saved to disk at: ${tempZipPath}`);

//       publishProgress(logId, "unzip", 50);
//       const extractPath = path.join(tempDir, `log-${logId}`);
//       if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath);

//       const zip = new AdmZip(tempZipPath);
//       zip.extractAllTo(extractPath, true);

//       publishProgress(logId, "unzip", 100);
//       console.log(` Extracted files to: ${extractPath}`);

//       const extractedFiles = fs.readdirSync(extractPath);
//       console.log(` Found ${extractedFiles.length} log files in .zip`);

//       publishProgress(logId, "parsing", 10);

//       for (const fileName of extractedFiles) {
//         const filePath = path.join(extractPath, fileName);
//         if (!fileName.endsWith(".txt")) {
//           throw new Error(
//             ` Invalid file detected: ${fileName}. Only .txt or .log files are allowed.`
//           );
//         }

//         console.log(` Processing extracted file: ${fileName}`);
//         console.time("generate attempt");
//         publishProgress(logId, "parsing", 20);

//         const attemptOutputPath = path.join(extractPath, `attempts.json`);
//         const structuredLogInstances = await generateAttemptSegments(
//           filePath,
//           logId,
//           attemptOutputPath
//         );
//         console.timeEnd("generate attempt");
//         const petJob = await petQueue.add("parse-pets", { logId, filePath });
//         publishProgress(logId, "segmentation", 30);
//         console.log(`✅ Generated segmented attempts for ${logId}`);
//         console.time("damage heal parser");
//         const damageHealJob = await damageHealQueue.add("parse-damage-heal", {
//           logId,
//           attemptsPath: attemptOutputPath,
//         });

//         await damageHealJob.waitUntilFinished(damageHealQueueEvents);
//         console.timeEnd("damage heal parser");
//         publishProgress(logId, "parsing", 50);
//         console.log(`✅ Log parsing completed for log ID: ${logId}`);
//         console.time("redis pointer caching");
//         if (structuredLogInstances && Array.isArray(structuredLogInstances)) {
//           console.log(`🔹 Caching structured fights (multiple instances)...`);
//           await petJob.waitUntilFinished(petQueueEvents);
//           await cacheInstancePointersToRedis(logId, structuredLogInstances);
//         }
//         console.timeEnd("redis pointer caching");
//       }

//       publishProgress(logId, "completed", 100);
//       console.log(` Processing completed for log ID: ${logId}`);

//       // fs.unlinkSync(tempZipPath);
//       // fs.rmSync(path.join(tempDir, `log-${logId}`), {
//       //   recursive: true,
//       //   force: true,
//       // });
//       console.log(` Cleaned up temp files.`);
//     } catch (error) {
//       console.error(" Error processing log:", error);
//       fs.writeFileSync(
//         `/tmp/log-${logId}-error.json`,
//         JSON.stringify({ error: err.message })
//       );

//       await prisma.logs.update({
//         where: { logId: job.data.logId },
//         data: { processingStatus: "failed" },
//       });

//       publishProgress(job.data.logId, "error", error.message);
//     }
//   },
//   { connection: redisConnection }
// );

// console.log(" Log processing worker started...");

// export default logWorker;
