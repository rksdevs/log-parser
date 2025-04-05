import prisma from "../config/db.js";
import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { postgresQueue } from "../queues/postgresQueue.js";
import { mergeQueue } from "../queues/mergeQueue.js";

// const postgresQueue = new Queue("postgres-save-queue-new", {
//   connection: redisConnection,
// });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const selectLogInstance = async (req, res) => {
  const { logId } = req.params;
  const { selectedIndex } = req.body;

  try {
    if (selectedIndex === undefined) {
      res.status(400).json({ error: "Need selected log instance" });
    }

    const redisKey = `log:${logId}:instances`;
    const redisData = await redisConnection.get(redisKey);

    if (!redisData) {
      res.status(404).json({
        error:
          "Selected instance not found: cache expired, try uploading new log again!",
      });
    }

    // console.log(redisData);

    const { instancePaths } = JSON.parse(redisData);
    const filePath = instancePaths[selectedIndex];

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Log instance file not found" });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const selectedInstance = JSON.parse(fileContent);
    const encounterStartTime = selectedInstance.encounterStartTime;

    const parsedPath = path.join(
      __dirname,
      "../logs/json",
      `log-${logId}-parsed.json`
    );

    if (!fs.existsSync(parsedPath)) {
      return res
        .status(404)
        .json({ error: "Parsed data not found for this logId" });
    }

    const parsedInstances = JSON.parse(fs.readFileSync(parsedPath, "utf-8"));
    const enrichedInstance = parsedInstances.find(
      (inst) => inst.encounterStartTime === encounterStartTime
    );

    // const parsedInstanceStartTimes = parsedInstances.map(
    //   (inst) => inst.encounterStartTime
    // );

    if (!enrichedInstance) {
      return res.status(404).json({
        error: "Structured instance not found for selected encounterStartTime",
      });
    }

    await mergeQueue.add("merge-worker", {
      logId: parseInt(logId),
      selectedInstanceTime: enrichedInstance.encounterStartTime,
      structuredFights: enrichedInstance.fights,
    });

    await prisma.logs.update({
      where: { logId: parseInt(logId) },
      data: { processingStatus: "queued_for_db" },
    });

    // 🧼 Cleanup
    const instanceDir = path.dirname(filePath);
    fs.rmSync(instanceDir, { recursive: true, force: true });
    // fs.unlinkSync(parsedPath); // delete enriched JSON
    await redisConnection.del(redisKey);

    return res.status(200).json({
      message:
        "Selected instance queued for DB upload and temp files cleaned up",
    });
  } catch (error) {
    console.error("Error selecting log instance:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// 👇 NEW FUNCTION for raw instance selection (before parsing)
export const selectRawLogInstance = async (req, res) => {
  const { logId } = req.params;
  const { selectedIndex } = req.body;

  try {
    if (selectedIndex === undefined) {
      return res
        .status(400)
        .json({ error: "Need selected log instance index" });
    }

    const redisKey = `log:${logId}:instances`;
    const redisData = await redisConnection.get(redisKey);

    if (!redisData) {
      return res.status(404).json({
        error:
          "Selected instance not found: cache expired, try uploading new log again!",
      });
    }

    const { instancePaths } = JSON.parse(redisData);
    const selectedPath = instancePaths[selectedIndex];

    if (!fs.existsSync(selectedPath)) {
      return res.status(404).json({ error: "Log instance file not found" });
    }

    const instanceMeta = JSON.parse(fs.readFileSync(selectedPath, "utf-8"));
    const rawTxtPath = path.join(
      __dirname,
      "../tmp",
      `log-${logId}`,
      "WoWCombatLog.txt"
    );

    if (!fs.existsSync(rawTxtPath)) {
      return res.status(404).json({ error: "Raw .txt log file not found" });
    }

    // Slice selected log range
    const rawLines = fs.readFileSync(rawTxtPath, "utf-8").split("\n");
    const selectedLines = rawLines.slice(
      instanceMeta.lineStart,
      instanceMeta.lineEnd + 1
    );

    const instanceFilePath = path.join(
      __dirname,
      "../logs/json",
      `log-${logId}-instance.txt`
    );
    fs.writeFileSync(instanceFilePath, selectedLines.join("\n"));

    // Trigger workers like generateAttemptSegments or damageHealQueue here
    await damageHealQueue.add("parse-damage-heal", {
      logId,
      attemptsPath: instanceFilePath, // or pass it to generateAttemptSegments
    });

    await prisma.logs.update({
      where: { logId: parseInt(logId) },
      data: { processingStatus: "queued_for_parsing" },
    });

    return res.status(200).json({
      message: "Selected instance sliced and parsing queued",
    });
  } catch (err) {
    console.error("Error selecting raw log instance:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
