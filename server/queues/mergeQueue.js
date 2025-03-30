import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

const mergeQueue = new Queue("merge-worker", { connection: redisConnection });

export { mergeQueue };
