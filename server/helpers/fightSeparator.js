import { getBossName } from "../helpers/bossHelper.js";

/**
 * Splits logs into separate fight attempts based on time gaps.
 * @param {Array} logLines - Array of log objects (not necessarily grouped by boss).
 * @returns {Array} - List of structured attempts, grouped by boss.
 */
function splitToAttempts(logLines) {
  const bossAttempts = {};
  let currentAttempt = {};
  let lastTimestamp = {};

  const MAX_GAP = 30000; // 30 seconds (adjustable per boss)

  for (const log of logLines) {
    const { timestamp, raw, targetGUID } = log;
    const timeInMs = convertTimestampToMs(timestamp);

    // 🔹 Ensure we are correctly identifying the boss from the targetGUID
    const bossName = getBossName(targetGUID);
    if (!bossName) continue; // Skip if it's not a boss-related event

    // 🔹 Initialize tracking for this boss if not already present
    if (!bossAttempts[bossName]) bossAttempts[bossName] = [];
    if (!currentAttempt[bossName]) currentAttempt[bossName] = [];
    if (!lastTimestamp[bossName]) lastTimestamp[bossName] = null;

    // 🛑 Check for fight segmentation (wipe/reset detection)
    if (
      lastTimestamp[bossName] &&
      timeInMs - lastTimestamp[bossName] > MAX_GAP
    ) {
      bossAttempts[bossName].push(
        processAttempt(currentAttempt[bossName], bossName)
      );
      currentAttempt[bossName] = [];
    }

    // 🔹 Add log entry to current attempt
    currentAttempt[bossName].push(log);
    lastTimestamp[bossName] = timeInMs;
  }

  // 🔹 Push any remaining active attempts
  for (const boss in currentAttempt) {
    if (currentAttempt[boss].length > 0) {
      bossAttempts[boss].push(processAttempt(currentAttempt[boss], boss));
    }
  }

  // console.log("from boss Attempts: ", bossAttempts);

  return bossAttempts;
}

/**
 * Extracts relevant details from an attempt and cleans up data.
 * @param {Array} attemptLogs - List of log lines in the attempt.
 * @param {String} bossName - The name of the boss.
 * @returns {Object} - Processed fight attempt.
 */
function processAttempt(attemptLogs, bossName) {
  if (attemptLogs.length === 0) return null;

  const startTime = attemptLogs[0].timestamp;
  const endTime = attemptLogs[attemptLogs.length - 1].timestamp;

  return {
    boss: bossName,
    startTime,
    endTime,
    logs: attemptLogs.map((log) => ({
      timestamp: log.timestamp,
      eventType: log.eventType,
      sourceGUID: log.sourceGUID,
      targetGUID: log.targetGUID,
      spellId: log.spellId,
      spellName: log.spellName,
    })),
  };
}

/**
 * Converts log timestamp (MM/DD HH:MM:SS.mmm) to milliseconds for comparison.
 * @param {String} timestamp - Log timestamp string.
 * @returns {Number} - Time in milliseconds.
 */
function convertTimestampToMs(timestamp) {
  const [date, time] = timestamp.split(" ");
  const [month, day] = date.split("/");
  const [hours, minutes, seconds] = time.split(":");

  return new Date(
    2024, // Year is arbitrary, we only care about time diffs
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseFloat(seconds) // Includes milliseconds
  ).getTime();
}

export { splitToAttempts };
