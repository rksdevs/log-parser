import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

const logQueue = new Queue("log-processing-queue", {
  connection: redisConnection,
});

async function retryFailedJobs() {
  const failedJobs = await logQueue.getFailed();
  for (const job of failedJobs) {
    console.log(`🔄 Retrying job ID: ${job.id}`);
    await job.retry();
  }
}

retryFailedJobs();
