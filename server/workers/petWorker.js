// workers/petWorker.js

// import fs from "fs";
// import readline from "readline";
// import path from "path";
// import { fileURLToPath } from "url";
// import { splitToAttempts } from "../helpers/fightSep.js";
// import { resolvePetRelationsFromLogs } from "../helpers/petRelationResolver.js";
// import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// async function processPetLog(filePath, logId) {
//   const logStream = fs.createReadStream(filePath);
//   const rl = readline.createInterface({ input: logStream });

//   const bossLogs = {}; // Raw logs per boss for splitting
//   const rawLogLines = [];

//   for await (const line of rl) {
//     if (!line?.trim()) continue;

//     const firstSpaceIndex = line.indexOf(" ");
//     const secondSpaceIndex = line.indexOf(" ", firstSpaceIndex + 1);
//     const timestamp = line.substring(0, secondSpaceIndex);
//     const eventData = line.substring(secondSpaceIndex + 1);
//     const parts = eventData.split(",");
//     if (parts.length < 5) continue;

//     const eventType = parts[0];
//     const sourceGUID = parts[1]?.replace("0x", "");
//     const sourceName = parts[2]?.replace(/"/g, "");
//     const targetGUID = parts[4]?.replace("0x", "");
//     const targetName = parts[5]?.replace(/"/g, "");
//     const spellId = parts[7] || null;
//     const spellName = parts[8]?.replace(/"/g, "") || null;

//     const logLine = {
//       timestamp,
//       eventType,
//       sourceGUID,
//       targetGUID,
//       sourceName,
//       targetName,
//       spellId,
//       spellName,
//       raw: line,
//     };

//     rawLogLines.push(logLine);

//     const bossName = getBossName(targetGUID) || getBossName(sourceGUID);
//     const multiBossName =
//       getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
//     const resolvedBoss = multiBossName || bossName;
//     if (!resolvedBoss) continue;

//     if (!bossLogs[resolvedBoss]) bossLogs[resolvedBoss] = [];
//     bossLogs[resolvedBoss].push(logLine);
//   }

//   const { petOwners, allGuids, petsPerma, missingOwner, otherPermaPets } =
//     resolvePetRelationsFromLogs(rawLogLines);
//   const playerStats = {}; // Pet spell processing doesn't use class right now

//   const output = {};
//   for (const boss in bossLogs) {
//     const logs = bossLogs[boss];
//     const attempts = splitToAttempts(logs, playerStats, allGuids, petOwners);
//     output[boss] = attempts;
//   }

//   const outputDir = path.join(__dirname, "../logs/pets");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   const outputPath = path.join(outputDir, `pets-log-${logId}.json`);
//   fs.writeFileSync(
//     outputPath,
//     JSON.stringify(
//       {
//         logId,
//         output,
//         // petOwners,
//         // allGuids,
//         // petsPerma,
//         // missingOwner,
//         // otherPermaPets,
//       },
//       null,
//       2
//     )
//   );
//   console.log(`✅ Pet processing complete. Output written to ${outputPath}`);
// }

// workers/petWorker.js

import fs from "fs";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import { splitToAttempts } from "../helpers/fightSep.js";
import { resolvePetRelationsFromLogs } from "../helpers/petRelationResolver.js";
import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processPetLog(filePath, logId) {
  const logStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: logStream });

  const structuredFights = {}; // 🧠 Multi-boss safe output container
  const rawLogLines = [];

  for await (const line of rl) {
    if (!line?.trim()) continue;

    const firstSpaceIndex = line.indexOf(" ");
    const secondSpaceIndex = line.indexOf(" ", firstSpaceIndex + 1);
    const timestamp = line.substring(0, secondSpaceIndex);
    const eventData = line.substring(secondSpaceIndex + 1);
    const parts = eventData.split(",");
    if (parts.length < 5) continue;

    const eventType = parts[0];
    const sourceGUID = parts[1]?.replace("0x", "");
    const sourceName = parts[2]?.replace(/"/g, "");
    const targetGUID = parts[4]?.replace("0x", "");
    const targetName = parts[5]?.replace(/"/g, "");
    const spellId = parts[7] || null;
    const spellName = parts[8]?.replace(/"/g, "") || null;

    const logLine = {
      timestamp,
      eventType,
      sourceGUID,
      targetGUID,
      sourceName,
      targetName,
      spellId,
      spellName,
      raw: line,
    };

    rawLogLines.push(logLine);

    // 🧠 Set up boss identification like logParser
    let bossName = getBossName(targetGUID) || getBossName(sourceGUID);
    const multiBossName =
      getMultiBossName(targetGUID) || getMultiBossName(sourceGUID);
    if (multiBossName) {
      bossName = multiBossName;
      logLine.multiBossEncounter = true; // 🧠 mark multi boss flag
    }
    if (!bossName) continue;

    if (!structuredFights[bossName]) structuredFights[bossName] = [];
    structuredFights[bossName].push(logLine);
  }

  const { petOwners, allGuids, petsPerma, missingOwner, otherPermaPets } =
    resolvePetRelationsFromLogs(rawLogLines);
  const playerStats = {}; // Pet spell processing doesn't use class

  const output = {};
  for (const boss in structuredFights) {
    const logs = structuredFights[boss];
    const attempts = splitToAttempts(logs, playerStats, allGuids, petOwners);
    output[boss] = attempts;
  }

  const outputDir = path.join(__dirname, "../logs/pets");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `pets-log-${logId}.json`);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        logId,
        output,
        petOwners,
        allGuids,
        petsPerma,
        missingOwner,
        otherPermaPets,
      },
      null,
      2
    )
  );
  console.log(`✅ Pet processing complete. Output written to ${outputPath}`);
}

processPetLog("../server/logs/json/Sample-togc-10-inno.txt", 155);

export { processPetLog };
