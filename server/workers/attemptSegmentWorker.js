import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { splitToAttempts } from "../helpers/fightSep.js";
import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INSTANCE_GAP_MS = 3 * 60 * 60 * 1000; // 3 hours
const MAX_GAP = 30000;

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

// export async function generateAttemptSegments(filePath, logId, outputPath) {
//   const rl = readline.createInterface({
//     input: fs.createReadStream(filePath),
//     crlfDelay: Infinity,
//   });

//   let logInstances = [];
//   let currentInstance = { name: null, fights: {}, firstTimestamp: null };
//   let lastTimestamp = null;
//   // const structuredFights = {};

//   for await (let line of rl) {
//     if (!line?.trim()) continue;

//     const firstSpace = line.indexOf(" ");
//     const secondSpace = line.indexOf(" ", firstSpace + 1);
//     const timestamp = line.substring(0, secondSpace);
//     const timestampMs = parseTimestampToMs(timestamp);

//     const eventData = line.substring(secondSpace + 1);
//     const parts = eventData.split(",");
//     if (parts.length < 5) continue;

//     const eventType = parts[0];
//     const sourceGUID = parts[1]?.replace("0x", "");
//     const sourceName = parts[2]?.replace(/"/g, "");
//     const targetGUID = parts[4]?.replace("0x", "");
//     const targetName = parts[5]?.replace(/"/g, "");

//     let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
//     const multiBoss =
//       getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);

//     if (multiBoss) {
//       bossName = multiBoss;
//       line = line + " ##MULTIBOSS##";
//     }

//     if (!bossName) continue;

//     // ✨ Start a new log instance if this boss is >3hr away from last
//     if (
//       lastTimestamp !== null &&
//       timestampMs - lastTimestamp > INSTANCE_GAP_MS
//     ) {
//       if (Object.keys(currentInstance.fights).length > 0) {
//         logInstances.push({
//           name: currentInstance.name,
//           fights: currentInstance.fights,
//         });
//       }

//       currentInstance = { name: null, fights: {}, firstTimestamp: null };
//     }

//     // Initialize name based on first boss timestamp
//     if (!currentInstance.name && timestampMs) {
//       currentInstance.firstTimestamp = timestampMs;
//       currentInstance.name = timestamp;
//     }

//     lastTimestamp = timestampMs;

//     // Push raw line into fights[bossName]
//     if (!currentInstance.fights[bossName]) {
//       currentInstance.fights[bossName] = [];
//     }

//     currentInstance.fights[bossName].push(line);

//     // if (!currentInstance.fights.hasOwnProperty(bossName)) {
//     // }
//     // currentInstance.fights.bossName =
//   }

//   // Push final instance
//   if (Object.keys(currentInstance.fights).length > 0) {
//     logInstances.push({
//       name: currentInstance.name,
//       fights: currentInstance.fights,
//     });
//   }

//   // 🔄 For each instance, split boss logs into attempt-wise logs
//   const output = logInstances.map((instance) => {
//     const { name, fights } = instance;
//     const parsedFights = {};
//     const dummyStats = {};
//     const dummyGuids = {};
//     const dummyPets = {};

//     for (const boss in fights) {
//       const logs = fights[boss];
//       const attempts = splitToAttempts(logs, dummyStats, dummyGuids, dummyPets);

//       parsedFights[boss] = (attempts[boss] || []).map((attempt) => ({
//         boss,
//         startTime: attempt.startTime,
//         endTime: attempt.endTime,
//         logs: attempt.logs
//           .map((l) => (typeof l === "string" ? l : l.raw || null))
//           .filter(Boolean),
//       }));
//     }

//     return {
//       name,
//       fights: parsedFights,
//     };
//   });

//   const outputDir = path.join(__dirname, "../logs/segments");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   const finalPath =
//     outputPath || path.join(outputDir, `attempts-log-${logId}.json`);
//   fs.writeFileSync(finalPath, JSON.stringify(output, null, 2));

//   console.log(`✅ Segmented ${output.length} log instances for log ${logId}`);
// }

// export async function generateAttemptSegments(filePath, logId, outputPath) {
//   const rl = readline.createInterface({
//     input: fs.createReadStream(filePath),
//     crlfDelay: Infinity,
//   });

//   const logInstances = [];
//   let currentInstance = {
//     name: null,
//     encounterStartTime: null,
//     rawBossLogs: {},
//   };
//   let lastTimestamp = null;

//   for await (let line of rl) {
//     if (!line?.trim()) continue;

//     const firstSpace = line.indexOf(" ");
//     const secondSpace = line.indexOf(" ", firstSpace + 1);
//     const timestamp = line.substring(0, secondSpace);
//     const timestampMs = parseTimestampToMs(timestamp);

//     const eventData = line.substring(secondSpace + 1);
//     const parts = eventData.split(",");
//     if (parts.length < 5) continue;

//     const sourceGUID = parts[1]?.replace("0x", "");
//     const targetGUID = parts[4]?.replace("0x", "");

//     let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
//     const multiBoss =
//       getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
//     if (multiBoss) {
//       bossName = multiBoss;
//       line += " ##MULTIBOSS##";
//     }

//     if (!bossName) continue;

//     // 3hr split → new instance
//     if (
//       lastTimestamp !== null &&
//       timestampMs - lastTimestamp > INSTANCE_GAP_MS
//     ) {
//       if (Object.keys(currentInstance.rawBossLogs).length > 0) {
//         logInstances.push({ ...currentInstance });
//       }

//       currentInstance = {
//         name: timestamp,
//         encounterStartTime: new Date(timestampMs)
//           .toISOString()
//           .slice(0, 19)
//           .replace("T", " "),
//         rawBossLogs: {},
//       };
//     }

//     // Set instance name/startTime
//     if (!currentInstance.name) {
//       currentInstance.name = timestamp;
//       currentInstance.encounterStartTime = new Date(timestampMs)
//         .toISOString()
//         .slice(0, 19)
//         .replace("T", " ");
//     }

//     // Group raw lines by bossName
//     if (!currentInstance.rawBossLogs[bossName]) {
//       currentInstance.rawBossLogs[bossName] = [];
//     }
//     currentInstance.rawBossLogs[bossName].push(line);
//     lastTimestamp = timestampMs;
//   }

//   // Push final instance
//   if (Object.keys(currentInstance.rawBossLogs).length > 0) {
//     logInstances.push({ ...currentInstance });
//   }

//   // Now split boss logs into attempt-wise structured format
//   const structured = logInstances.map((instance) => {
//     const parsedFights = {};
//     const dummyStats = {};
//     const dummyGuids = {};
//     const dummyPets = {};

//     for (const boss in instance.rawBossLogs) {
//       const logs = instance.rawBossLogs[boss];
//       const attempts = splitToAttempts(logs, dummyStats, dummyGuids, dummyPets);

//       if (!attempts[boss]) continue;

//       // Filter and format each attempt
//       parsedFights[boss] = attempts[boss]
//         .filter((attempt) => {
//           const start = new Date(attempt.startTime);
//           const end = new Date(attempt.endTime);
//           return (end - start) / 1000 > 30; // filter wipes
//         })
//         .map((attempt) => ({
//           boss,
//           startTime: attempt.startTime,
//           endTime: attempt.endTime,
//           logs: attempt.logs
//             .map((line) => (typeof line === "string" ? line : line.raw))
//             .filter(Boolean),
//         }));
//     }

//     return {
//       name: instance.name,
//       encounterStartTime: instance.encounterStartTime,
//       fights: {
//         [instance.name]: parsedFights, // Nest all bosses under encounter name
//       },
//     };
//   });

//   // Save to file
//   const outputDir = path.join(__dirname, "../logs/segments");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   const finalPath =
//     outputPath || path.join(outputDir, `attempts-log-${logId}.json`);
//   fs.writeFileSync(finalPath, JSON.stringify(structured, null, 2));
//   console.log(
//     `✅ Segmented ${structured.length} log instances for log ${logId}`
//   );
// }

export async function generateAttemptSegments(filePath, logId, outputPath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  const logInstances = [];
  let currentInstance = {
    name: null,
    encounterStartTime: null,
    rawBossLogs: {},
  };
  let lastTimestamp = null;

  for await (let line of rl) {
    if (!line?.trim()) continue;

    const firstSpace = line.indexOf(" ");
    const secondSpace = line.indexOf(" ", firstSpace + 1);
    const timestamp = line.substring(0, secondSpace);
    const timestampMs = parseTimestampToMs(timestamp);

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

    // Split log instance by 3 hours gap
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
      };
    }

    // First boss hit for this instance
    if (!currentInstance.name) {
      currentInstance.name = timestamp;
      currentInstance.encounterStartTime = new Date(timestampMs)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    }

    // Add log to boss group
    if (!currentInstance.rawBossLogs[bossName]) {
      currentInstance.rawBossLogs[bossName] = [];
    }
    currentInstance.rawBossLogs[bossName].push(line);
    lastTimestamp = timestampMs;
  }

  // Push last instance
  if (Object.keys(currentInstance.rawBossLogs).length > 0) {
    logInstances.push({ ...currentInstance });
  }

  // Build structured output
  const structured = logInstances.map((instance) => {
    const { rawBossLogs, name, encounterStartTime } = instance;
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
        .map((attempt) => ({
          boss: attempt.boss,
          startTime: attempt.startTime,
          endTime: attempt.endTime,
          logs: attempt.logs
            .map((log) => (typeof log === "string" ? log : log.raw))
            .filter(Boolean),
        }));

      // Nest like: fights → EncounterName → BossName → [attempts]
      if (!bossGrouped[bossName]) bossGrouped[bossName] = {};
      bossGrouped[bossName][bossName] = cleanedAttempts;
    }

    return {
      name,
      encounterStartTime,
      fights: bossGrouped,
    };
  });

  // Save result
  const outputDir = path.join(__dirname, "../logs/segments");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const finalPath =
    outputPath || path.join(outputDir, `attempts-log-${logId}.json`);
  fs.writeFileSync(finalPath, JSON.stringify(structured, null, 2));

  console.log(
    `✅ Segmented ${structured.length} log instances for log ${logId}`
  );
}

// generateAttemptSegments("../server/logs/json/2-togc-10-inno.txt", 215);

// generateAttemptSegments("../server/logs/json/Sample-togc-10-inno.txt", 155);
