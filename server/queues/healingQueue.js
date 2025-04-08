import { Queue, QueueEvents } from "bullmq";
import { redisConnection } from "../config/redis.js";

const healQueue = new Queue("only-heal-worker-queue", {
  connection: redisConnection,
});
const healQueueEvents = new QueueEvents("only-heal-worker-queue", {
  connection: redisConnection,
});

export { healQueue, healQueueEvents };
