// JS Version

import { Worker } from "bullmq";
import path from "path";

import { fileURLToPath } from "url";
import { redisConnection } from "../config/redis.js";
import Redis from "ioredis";
// import { processLogFile } from "../parsers/logParserNew.js";
import { processLogFile } from "../parsers/logParserV3.js";

const __fileName = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__fileName);

const redisPublisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const publishProgress = async (logId, stage, progress) => {
  const message = JSON.stringify({ stage, progress });
  console.log(`Damage worker log:${logId} - ${stage}, ${progress}`);
  await redisPublisher.publish(`log:${logId}`, message);
};

const damageHealWorker = new Worker(
  "damage-heal-worker-queue",
  async (job) => {
    const { logId, attemptsPath } = job.data;
    console.time("Damage heal worker timer");
    publishProgress(logId, "parsing damage and healing", 35);
    console.log(`Damage heal worker initiated for log: ${logId}`);
    const parsedFights = await processLogFile(attemptsPath, logId);
    console.log(`✅ Damage heal worker completed for log: ${logId}`);
    console.timeEnd("Damage heal worker timer");
    return parsedFights;
  },
  { connection: redisConnection }
);

console.log("🚀 Damage parsing worker started...");
export default damageHealWorker;

//Go version

// import { Worker } from "bullmq";
// import path from "path";
// import { fileURLToPath } from "url";
// import { redisConnection } from "../config/redis.js";
// import Redis from "ioredis";
// import { exec } from "child_process";
// import { promisify } from "util";

// const execAsync = promisify(exec);
// const __fileName = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__fileName);

// const redisPublisher = new Redis(
//   process.env.REDIS_URL || "redis://localhost:6379"
// );

// const publishProgress = async (logId, stage, progress) => {
//   const message = JSON.stringify({ stage, progress });
//   console.log(`Damage worker log:${logId} - ${stage}, ${progress}`);
//   await redisPublisher.publish(`log:${logId}`, message);
// };

// const damageHealWorker = new Worker(
//   "damage-heal-worker-queue",
//   async (job) => {
//     const { logId, attemptsPath } = job.data;
//     console.log(attemptsPath, "From attempts worker");
//     publishProgress(logId, "damage-parsing", 10);
//     console.log(`🚀 Starting Go-based damage/healing parser for log: ${logId}`);

//     try {
//       const { stdout, stderr } = await execAsync(
//         `go run ./parsers/logParser.go "${attemptsPath}" ${logId}`
//       );
//       if (stderr) {
//         console.error("⚠️ Go parser stderr:", stderr);
//       }
//       console.log("✅ Go parser completed:", stdout);
//     } catch (err) {
//       console.error("❌ Failed to run Go parser:", err);
//       throw err; // to mark job as failed
//     }

//     publishProgress(logId, "damage-parsing", 100);
//     return { status: "ok" };
//   },
//   { connection: redisConnection }
// );

// console.log("🚀 Damage parsing worker started...");
// export default damageHealWorker;
