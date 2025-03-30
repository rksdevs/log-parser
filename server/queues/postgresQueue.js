import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

const postgresQueue = new Queue("save-to-postgres-db-queue", {
  connection: redisConnection,
});

export { postgresQueue };
