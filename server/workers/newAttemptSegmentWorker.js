import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { splitToAttempts } from "../helpers/newFightSep.js";
import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INSTANCE_GAP_MS = 3 * 60 * 60 * 1000;

function parseTimestampToMs(timestamp) {
  try {
    const [date, time] = timestamp.split(" ");
    const [month, day] = date.split("/").map(Number);
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return new Date(2025, month - 1, day, hours, minutes, seconds).getTime();
  } catch (e) {
    return 0;
  }
}

export async function generateAttemptSegments(filePath, logId, outputPath) {
  console.time("attempt segregation");
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  const logInstances = [];
  let currentInstance = {
    name: null,
    encounterStartTime: null,
    rawBossLogs: {},
    allLogs: [],
  };
  let lastTimestamp = null;

  for await (let line of rl) {
    if (!line?.trim()) continue;

    const firstSpace = line.indexOf(" ");
    const secondSpace = line.indexOf(" ", firstSpace + 1);
    const timestamp = line.substring(0, secondSpace);
    const timestampMs = parseTimestampToMs(timestamp);

    currentInstance.allLogs.push({ line, timestampMs });

    const eventData = line.substring(secondSpace + 1);
    const parts = eventData.split(",");
    if (parts.length < 5) continue;

    const sourceGUID = parts[1]?.replace("0x", "");
    const targetGUID = parts[4]?.replace("0x", "");

    let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
    const multiBoss =
      getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
    if (multiBoss) {
      bossName = multiBoss;
      line += " ##MULTIBOSS##";
    }

    if (!bossName) continue;

    if (
      lastTimestamp !== null &&
      timestampMs - lastTimestamp > INSTANCE_GAP_MS
    ) {
      if (Object.keys(currentInstance.rawBossLogs).length > 0) {
        logInstances.push({ ...currentInstance });
      }

      currentInstance = {
        name: timestamp,
        encounterStartTime: new Date(timestampMs)
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        rawBossLogs: {},
        allLogs: [],
      };
    }

    if (!currentInstance.name) {
      currentInstance.name = timestamp;
      currentInstance.encounterStartTime = new Date(timestampMs)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    }

    if (!currentInstance.rawBossLogs[bossName]) {
      currentInstance.rawBossLogs[bossName] = [];
    }
    currentInstance.rawBossLogs[bossName].push(line);
    lastTimestamp = timestampMs;
  }

  if (Object.keys(currentInstance.rawBossLogs).length > 0) {
    logInstances.push({ ...currentInstance });
  }

  const structured = logInstances.map((instance) => {
    const { rawBossLogs, name, encounterStartTime, allLogs } = instance;
    const dummyStats = {};
    const dummyGuids = {};
    const dummyPets = {};
    const bossGrouped = {};

    for (const bossName in rawBossLogs) {
      const logs = rawBossLogs[bossName];
      const attemptsByBoss = splitToAttempts(
        logs,
        dummyStats,
        dummyGuids,
        dummyPets
      );

      if (!attemptsByBoss[bossName]) continue;

      const cleanedAttempts = attemptsByBoss[bossName]
        .filter((attempt) => {
          const start = new Date(attempt.startTime);
          const end = new Date(attempt.endTime);
          return (end - start) / 1000 > 30;
        })
        .map((attempt) => {
          const fullLogs = allLogs
            .filter(
              (lineObj) =>
                lineObj.timestampMs >= attempt.startMs &&
                lineObj.timestampMs <= attempt.endMs
            )
            .map((l) => l.line);

          return {
            boss: attempt.boss,
            startTime: attempt.startTime,
            endTime: attempt.endTime,
            name: `${attempt.boss} (${attempt.type})`,
            type: attempt.type,
            logs: fullLogs,
          };
        });

      if (!bossGrouped[bossName]) bossGrouped[bossName] = {};
      bossGrouped[bossName][bossName] = cleanedAttempts;
    }

    return {
      name,
      encounterStartTime,
      fights: bossGrouped,
    };
  });

  const outputDir = path.join(__dirname, "../logs/segments");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const finalPath =
    outputPath || path.join(outputDir, `attempts-log-${logId}.json`);
  fs.writeFileSync(finalPath, JSON.stringify(structured, null, 2));

  console.log(
    `✅ Segmented ${structured.length} log instances for log ${logId}`
  );
  console.timeEnd("attempt segregation");
  return structured;
}

generateAttemptSegments("../server/tmp/log-303/WoWCombatLog.txt", 300);

// generateAttemptSegments("../server/logs/json/Sample-togc-10-inno.txt", 155);
