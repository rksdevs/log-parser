import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { redisConnection } from "../config/redis.js";
import prisma from "../config/db.js";
import { generateAttemptSegments } from "../workers/generateAttemptsV3.js";
import {
  damageHealQueue,
  damageHealQueueEvents,
} from "../queues/damageHealQueue.js";
import { petQueue, petQueueEvents } from "../queues/petQueue.js";
import { mergeQueue } from "../queues/mergeQueue.js";
import { healQueue, healQueueEvents } from "../queues/healingQueue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const selectLogInstance = async (req, res) => {
  const { logId } = req.params;
  const { selectedIndex } = req.body;

  console.log(
    "📥 Instance selection triggered:",
    selectedIndex,
    "for log:",
    logId
  );

  try {
    if (selectedIndex === undefined) {
      return res.status(400).json({ error: "Need selected log instance" });
    }

    const redisKey = `log:${logId}:instances`;
    const redisData = await redisConnection.get(redisKey);

    if (!redisData) {
      return res
        .status(404)
        .json({ error: "Cache expired. Please upload the log again." });
    }

    const { instancePaths } = JSON.parse(redisData);
    const instanceFilePath = instancePaths[selectedIndex];

    if (!fs.existsSync(instanceFilePath)) {
      return res.status(404).json({ error: "Log instance file not found" });
    }

    const instance = JSON.parse(fs.readFileSync(instanceFilePath, "utf-8"));
    const { lineStart, lineEnd } = instance;

    // ✂️ Slice .txt file to instance
    const rawTxtPath = path.join(
      __dirname,
      "..",
      "tmp",
      `log-${logId}`,
      "WoWCombatLog.txt"
    );
    const rawLines = fs.readFileSync(rawTxtPath, "utf-8").split("\n");

    const slicedLines = rawLines.slice(lineStart, lineEnd + 1).join("\n");
    const slicedPath = path.join(
      __dirname,
      "..",
      "tmp",
      `log-${logId}-instance.txt`
    );
    fs.writeFileSync(slicedPath, slicedLines);

    // 🧠 Generate attempts
    const attemptsPath = path.join(
      __dirname,
      "..",
      "logs",
      "segments",
      `attempts-log-${logId}.json`
    );

    // 🚀 Start pet job early (independent of attempts)
    const petJob = await petQueue.add("parse-pets", {
      logId,
      filePath: slicedPath,
    });

    // 🧠 Segment attempts (needed only for damage/healing)
    try {
      await generateAttemptSegments(slicedPath, logId, attemptsPath);
    } catch (err) {
      console.error("❌ Failed to segment attempts:", err);
      return res.status(500).json({ error: "Attempt segmentation failed" });
    }

    // 🛠 Launch damage/heal job after segmentation is done
    const damageJob = await damageHealQueue.add("parse-damage-heal", {
      logId,
      attemptsPath,
    });

    const healJob = await healQueue.add("parse-heal", {
      logId,
      attemptsPath,
    });

    // ⏳ Wait for all jobs to finish in parallel
    await Promise.all([
      damageJob.waitUntilFinished(damageHealQueueEvents),
      petJob.waitUntilFinished(petQueueEvents),
      healJob.waitUntilFinished(healQueueEvents),
    ]);

    // const structuredPath = path.join(
    //   __dirname,
    //   "..",
    //   "logs",
    //   "json",
    //   `log-${logId}-parsed.json`
    // );

    const damagePath = path.join(
      __dirname,
      "..",
      "logs",
      "json",
      `log-${logId}-parsed.json`
    );

    const healPath = path.join(
      __dirname,
      "..",
      "logs",
      "heal",
      `heal-log-${logId}.json`
    );

    if (!fs.existsSync(damagePath)) {
      return res.status(404).json({ error: "Damage data file missing" });
    }

    if (!fs.existsSync(healPath)) {
      return res.status(404).json({ error: "Heal data file missing" });
    }

    const damageJson = JSON.parse(fs.readFileSync(damagePath, "utf-8"));
    const healJson = JSON.parse(fs.readFileSync(healPath, "utf-8"));

    const structuredFightsFromDamage = damageJson?.[0]?.fights;
    const structuredFightsFromHeal = healJson?.[0]?.fights;

    const encounterStartTimeDamage = damageJson?.[0]?.encounterStartTime;
    const encounterStartTimeHeal = healJson?.[0]?.encounterStartTime;

    if (!structuredFightsFromDamage) {
      return res
        .status(404)
        .json({ error: "No structured fights from damage output were found" });
    }

    if (!structuredFightsFromHeal) {
      return res
        .status(404)
        .json({ error: "No structured fights from heal output were found" });
    }

    if (encounterStartTimeDamage !== encounterStartTimeHeal) {
      return res.status(404).json({
        error: "Encounter start time mismatch between damage and heal",
      });
    }

    // 🐾 Merge pets + send to DB
    await mergeQueue.add("merge-worker", {
      logId,
      damageFights: structuredFightsFromDamage,
      healFights: structuredFightsFromHeal,
      selectedInstanceTime: encounterStartTimeDamage || encounterStartTimeHeal,
    });

    await prisma.logs.update({
      where: { logId: parseInt(logId) },
      data: {
        processingStatus: "queued_for_db",
      },
    });

    // 🧹 Cleanup
    fs.rmSync(path.dirname(instanceFilePath), { recursive: true, force: true });
    await redisConnection.del(redisKey);

    return res.status(200).json({
      message:
        "Instance selected, sliced, parsed and workers queued successfully.",
    });
  } catch (err) {
    console.error("❌ Failed during instance selection:", err);
    return res
      .status(500)
      .json({ error: "Server error while selecting instance" });
  }
};
