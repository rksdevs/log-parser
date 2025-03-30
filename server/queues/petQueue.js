import { Queue, QueueEvents } from "bullmq";
import { redisConnection } from "../config/redis.js";

const petQueue = new Queue("parse-pets", { connection: redisConnection });
const petQueueEvents = new QueueEvents("parse-pets", {
  connection: redisConnection,
});

export { petQueue, petQueueEvents };
