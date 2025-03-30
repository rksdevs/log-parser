// import fs from "fs";
// import readline from "readline";
// import path from "path";
// import { fileURLToPath } from "url";
// import { resolvePetRelationsFromLogs } from "../helpers/petRelationResolver.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// function parseTimestampToDate(logTimestamp) {
//   // Example: "2/12 23:29:28.092"
//   const [datePart, timePart] = logTimestamp.split(" ");
//   const [month, day] = datePart.split("/").map(Number);
//   const [hours, minutes, seconds] = timePart.split(":");
//   const [sec, millis] = seconds.split(".");

//   const now = new Date(); // For year
//   const year = now.getFullYear();

//   return new Date(
//     year,
//     month - 1,
//     day,
//     Number(hours),
//     Number(minutes),
//     Number(sec),
//     Number(millis)
//   );
// }

// function getEncounterStartTime(line) {
//   // const [timestamp] = line.split(" ");
//   // const parsed = parseTimestampToDate(timestamp);
//   const parts = line.split(" ");
//   const timestamp = parts[0] + " " + parts[1]; // "2/12 23:29:28.092"
//   const parsed = parseTimestampToDate(timestamp);
//   return parsed.toISOString().replace("T", " ").slice(0, 19); // "YYYY-MM-DD HH:mm:ss"
// }

// async function processPetLogInstancesFromTxt(filePath, logId) {
//   const rl = readline.createInterface({
//     input: fs.createReadStream(filePath),
//     crlfDelay: Infinity,
//   });

//   const logInstances = [];
//   let currentInstance = [];
//   let previousTime = null;

//   for await (const line of rl) {
//     if (!line?.trim()) continue;

//     const timestampStr = line.split(" ")[0] + " " + line.split(" ")[1];
//     const currentTime = parseTimestampToDate(timestampStr);

//     if (
//       previousTime &&
//       (currentTime.getTime() - previousTime.getTime()) / (1000 * 60 * 60) >= 3
//     ) {
//       // 3 hour gap
//       logInstances.push(currentInstance);
//       currentInstance = [];
//     }

//     currentInstance.push(line);
//     previousTime = currentTime;
//   }

//   if (currentInstance.length) logInstances.push(currentInstance);

//   // Run pet resolver per instance
//   const output = {
//     logId,
//     instances: [],
//   };

//   for (const lines of logInstances) {
//     const rawLogLines = [];

//     for (const line of lines) {
//       const firstSpaceIndex = line.indexOf(" ");
//       const secondSpaceIndex = line.indexOf(" ", firstSpaceIndex + 1);
//       const timestamp = line.substring(0, secondSpaceIndex);
//       const eventData = line.substring(secondSpaceIndex + 1);
//       const parts = eventData.split(",");

//       if (parts.length < 5) continue;

//       const eventType = parts[0];
//       const sourceGUID = parts[1]?.replace("0x", "");
//       const sourceName = parts[2]?.replace(/"/g, "");
//       const targetGUID = parts[4]?.replace("0x", "");
//       const targetName = parts[5]?.replace(/"/g, "");
//       const spellId = parts[7] || null;
//       const spellName = parts[8]?.replace(/"/g, "") || null;

//       rawLogLines.push({
//         timestamp,
//         eventType,
//         sourceGUID,
//         sourceName,
//         targetGUID,
//         targetName,
//         spellId,
//         spellName,
//         raw: line,
//       });
//     }

//     const result = resolvePetRelationsFromLogs(rawLogLines);

//     output.instances.push({
//       encounterStartTime: getEncounterStartTime(lines[0]),
//       petOwners: result.petOwners,
//       petsPerma: result.petsPerma,
//       missingOwner: result.missingOwner,
//       otherPermaPets: result.otherPermaPets,
//     });
//   }

//   const outputDir = path.join(__dirname, "../logs/pets");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   const outputPath = path.join(outputDir, `pets-log-${logId}.json`);
//   fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

//   console.log(`✅ Pets resolved and saved to ${outputPath}`);
//   return output;
// }

// // processPetLogInstancesFromTxt("../logs/json/2-togc-10-inno.txt", 204);

// export { processPetLogInstancesFromTxt };

import { Worker } from "bullmq";
import fs from "fs";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import { resolvePetRelationsFromLogs } from "../helpers/petRelationResolver.js";
import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseTimestampToDate(logTimestamp) {
  const [datePart, timePart] = logTimestamp.split(" ");
  const [month, day] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":");
  const [sec, millis] = seconds.split(".");
  const now = new Date();
  const year = now.getFullYear();
  return new Date(year, month - 1, day, +hours, +minutes, +sec, +millis);
}

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

function getEncounterStartTime(line) {
  const parts = line.split(" ");
  const timestamp = parts[0] + " " + parts[1];
  const parsed = parseTimestampToDate(timestamp);
  return parsed.toISOString().replace("T", " ").slice(0, 19);
}

const petWorker = new Worker(
  "parse-pets",
  async (job) => {
    const { filePath, logId } = job.data;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    const logInstances = [];
    let currentInstance = [];
    let previousTime = null;

    for await (const line of rl) {
      if (!line?.trim()) continue;

      const timestampStr = line.split(" ")[0] + " " + line.split(" ")[1];
      const currentTime = parseTimestampToDate(timestampStr);

      if (
        previousTime &&
        (currentTime.getTime() - previousTime.getTime()) / (1000 * 60 * 60) >= 3
      ) {
        logInstances.push(currentInstance);
        currentInstance = [];
      }

      currentInstance.push(line);
      previousTime = currentTime;
    }

    if (currentInstance.length) logInstances.push(currentInstance);

    const output = {
      logId,
      instances: [],
    };

    for (const lines of logInstances) {
      const rawLogLines = [];
      let bossStartTimestamp = null;
      for (const line of lines) {
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

        // Detect first boss
        const bossName =
          getBossName(targetGUID) ||
          getBossName(sourceGUID) ||
          getMultiBossName(targetGUID) ||
          getMultiBossName(sourceGUID);

        if (bossName && !bossStartTimestamp) {
          bossStartTimestamp = parseTimestampToMs(timestamp);
        }

        rawLogLines.push({
          timestamp,
          eventType,
          sourceGUID,
          sourceName,
          targetGUID,
          targetName,
          spellId,
          spellName,
          raw: line,
        });
      }

      const result = resolvePetRelationsFromLogs(rawLogLines);

      output.instances.push({
        encounterStartTime:
          new Date(bossStartTimestamp)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ") || getEncounterStartTime(lines[0]),
        petOwners: result.petOwners,
        petsPerma: result.petsPerma,
        missingOwner: result.missingOwner,
        otherPermaPets: result.otherPermaPets,
      });
    }

    const outputDir = path.join(__dirname, "../logs/pets");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `pets-log-${logId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Pets resolved and saved to ${outputPath}`);
    return output;
  },
  {
    connection: { host: "localhost", port: 6379 }, // adjust as needed
  }
);

petWorker.on("completed", (job) =>
  console.log(`🎉 PetWorker completed for logId ${job.data.logId}`)
);

petWorker.on("failed", (job, err) =>
  console.error(`❌ PetWorker failed for logId ${job?.data?.logId}`, err)
);

console.log("Pets worker started....");
