import { Worker } from "bullmq";
import path from "path";

import { fileURLToPath } from "url";
import { redisConnection } from "../config/redis.js";
import Redis from "ioredis";
import { processHealingLog } from "../parsers/healParserV1.js";

const __fileName = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__fileName);

const redisPublisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const publishProgress = async (logId, stage, progress) => {
  const message = JSON.stringify({ stage, progress });
  console.log(`Only heal worker log:${logId} - ${stage}, ${progress}`);
  await redisPublisher.publish(`log:${logId}`, message);
};

const healWorker = new Worker(
  "only-heal-worker-queue",
  async (job) => {
    const { logId, attemptsPath } = job.data;
    console.time("Heal worker timer");
    publishProgress(logId, "parsing healing", 37);
    console.log(`Heal worker initiated for log: ${logId}`);
    const parsedFights = await processHealingLog(attemptsPath, logId);
    console.log(`✅ Heal worker completed for log: ${logId}`);
    console.timeEnd("Heal worker timer");
    return parsedFights;
  },
  { connection: redisConnection }
);

console.log("🚀 Heal parsing worker started...");
export default healWorker;
