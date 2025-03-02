import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

//log processing queue

const logQueue = new Queue("log-processing-queue", {
  connection: redisConnection,
});

export default logQueue;
