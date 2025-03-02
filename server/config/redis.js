import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  { maxRetriesPerRequest: null }
);

export { redisConnection };
