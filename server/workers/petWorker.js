//working fine-6-4-25
import { Worker } from "bullmq";
import fs from "fs";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import { resolvePetRelationsFromLogs } from "../helpers/petRelationResolver.js";
import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";
import { redisConnection } from "../config/redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseTimestampToDate(logTimestamp) {
  const [datePart, timePart] = logTimestamp.split(" ");
  const [month, day] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":");
  const [sec, millis] = seconds.split(".");
  const year = new Date().getFullYear();
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
    try {
      const { filePath, logId } = job.data;
      console.log("✅ Pets worker initiated....");
      console.time("Pets worker timer");
      const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity,
      });

      const rawLogLines = [];
      let bossStartTimestamp = null;

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

      const output = {
        logId,
        instances: [
          {
            encounterStartTime:
              new Date(bossStartTimestamp)
                .toISOString()
                .slice(0, 19)
                .replace("T", " ") ||
              getEncounterStartTime(rawLogLines[0]?.raw),
            petOwners: result.petOwners,
            petsPerma: result.petsPerma,
            missingOwner: result.missingOwner,
            otherPermaPets: result.otherPermaPets,
          },
        ],
      };

      const outputDir = path.join(__dirname, "../logs/pets");
      if (!fs.existsSync(outputDir))
        fs.mkdirSync(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, `pets-log-${logId}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

      console.log(
        "Pet start time from pet worker: ",
        new Date(bossStartTimestamp)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ") || getEncounterStartTime(rawLogLines[0]?.raw)
      );

      console.log(`✅ Pets resolved and saved to ${outputPath}`);
      console.timeEnd("Pets worker timer");
      return output;
    } catch (err) {
      console.error("❌ PetWorker failed for logId", job.data.logId, err);
      throw err;
    }
  },
  {
    connection: redisConnection,
    lockDuration: 300000,
    stalledInterval: 60000,
    maxStalledCount: 2,
  }
);

petWorker.on("completed", (job) =>
  console.log(`🎉 PetWorker completed for logId ${job.data.logId}`)
);

petWorker.on("failed", (job, err) =>
  console.error(`❌ PetWorker failed for logId ${job?.data?.logId}`, err)
);

console.log("🐾 Pets worker started...");
