import { Worker } from "bullmq";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
import { redisConnection } from "../config/redis.js";
import Redis from "ioredis";
import { processLogFile } from "../parsers/logParserNew.js";

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
    publishProgress(logId, "damage-parsing", 10);
    console.log(`Starting damage/healing parser for log: ${logId}`);
    const parsedFights = await processLogFile(attemptsPath, logId);
    publishProgress(logId, "damage-parsing", 100);
    console.log(`✅ Damage parser completed for log: ${logId}`);
    return parsedFights;
  },
  { connection: redisConnection }
);

console.log("🚀 Damage parsing worker started...");
export default damageHealWorker;

// import { Worker } from "bullmq";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { redisConnection } from "../config/redis.js";
// import Redis from "ioredis";
// import { processLogFile } from "../parsers/logParserNew.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const redisPublisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// const publishProgress = async (logId, stage, progress) => {
//   const message = JSON.stringify({ stage, progress });
//   console.log(`📦 [DamageWorker] log:${logId} - ${stage} (${progress}%)`);
//   await redisPublisher.publish(`log:${logId}`, message);
// };

// const damageWorker = new Worker(
//   "damage-worker-queue",
//   async (job) => {
//     const { logId, attemptsPath } = job.data;
//     publishProgress(logId, "damage-parsing", 10);
//     console.log(`🛠️ Starting damage parser for log: ${logId}`);

//     const parsedFights = await processLogFile(attemptsPath, logId);

//     publishProgress(logId, "damage-parsing", 100);
//     console.log(`✅ Damage parser completed for log: ${logId}`);
//     return parsedFights;
//   },
//   { connection: redisConnection }
// );

// console.log("🚀 Damage parsing worker started...");
// export default damageWorker;
