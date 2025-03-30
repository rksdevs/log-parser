import { Queue, QueueEvents } from "bullmq";
import { redisConnection } from "../config/redis.js";

const damageHealQueue = new Queue("damage-heal-worker-queue", {
  connection: redisConnection,
});
const damageHealQueueEvents = new QueueEvents("damage-heal-worker-queue", {
  connection: redisConnection,
});

export { damageHealQueue, damageHealQueueEvents };
