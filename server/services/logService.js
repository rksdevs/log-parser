import { redisConnection } from "../config/redis.js";

/**
 * Retrieves log from Redis
 * @param {String} userId - User ID
 * @param {String} logId - Log ID
 * @returns {Object|null} - Log data or null if not found
 */
export async function getLogFromRedis(userId, logId) {
  console.log(userId, logId);
  try {
    const key = `log:${userId}:${logId}`;
    const logData = await redisConnection.get(key);
    return logData ? JSON.parse(logData) : null;
  } catch (error) {
    console.error(" Redis fetch error:", error);
    return null;
  }
}
