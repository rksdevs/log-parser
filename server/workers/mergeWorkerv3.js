import { Worker } from "bullmq";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { postgresQueue } from "../queues/postgresQueue.js";
import { redisConnection } from "../config/redis.js";
import Redis from "ioredis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const redisPublisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const publishProgress = async (logId, stage, progress) => {
  const message = JSON.stringify({ stage, progress });
  console.log(`Merge worker log:${logId} - ${stage}, ${progress}`);
  await redisPublisher.publish(`log:${logId}`, message);
};

function mergePetsIntoActors(structuredFights, petInstance) {
  const petMetaMap = Object.values(petInstance.petsPerma);

  for (const encounterName in structuredFights) {
    const encounter = structuredFights[encounterName];

    for (const bossName in encounter) {
      const attempts = encounter[bossName];

      for (const attempt of attempts) {
        const { allActors } = attempt;
        if (!allActors) continue;

        for (const petMeta of petMetaMap) {
          const { name: petName, master_name: ownerName } = petMeta;

          if (!allActors[petName] || !allActors[ownerName]) continue;

          if (!allActors[ownerName].pets) {
            allActors[ownerName].pets = {};
          }

          allActors[ownerName].pets[petName] = allActors[petName];
          delete allActors[petName];
        }
      }
    }
  }

  return structuredFights;
}

const mergeWorker = new Worker(
  "merge-worker",
  async (job) => {
    const { logId, selectedInstanceTime, structuredFights } = job.data;

    let mergedFights = structuredFights;

    // 🔁 Attempt to merge pets if possible
    try {
      const petsFilePath = path.join(
        __dirname,
        "../logs/pets",
        `pets-log-${logId}.json`
      );

      if (fs.existsSync(petsFilePath)) {
        const petsData = JSON.parse(fs.readFileSync(petsFilePath, "utf8"));

        const match = petsData.instances.find(
          (instance) => instance.encounterStartTime === selectedInstanceTime
        );

        if (match) {
          console.log(`🐾 Merging pets for logId ${logId}`);
          mergedFights = mergePetsIntoActors(structuredFights, match);
        } else {
          console.warn(
            `⚠️ Pet instance not found for encounterStartTime: ${selectedInstanceTime}`
          );
        }
      } else {
        console.warn(
          `⚠️ Pets file not found for logId ${logId}, skipping pet merge`
        );
      }
    } catch (err) {
      console.warn(
        `⚠️ Error during pet merge for logId ${logId}:`,
        err.message
      );
    }

    // 🧩 ⬇️ Future merges here:
    // ───────────────────────────────────────────────
    // TODO: Merge timeline data here
    // TODO: Merge buffs/debuffs here
    // TODO: Merge death logs here
    // TODO: Merge player stats snapshot here (e.g. gear, spec)
    // const timelineData = loadTimelineFile(logId)
    // mergedFights = mergeTimelineIntoFights(mergedFights, timelineData)
    // ───────────────────────────────────────────────

    // 🧪 Debug dump
    const debugDir = path.join(__dirname, "../logs/mergesnippet");
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

    const debugPath = path.join(debugDir, `merge-log-${logId}.json`);
    fs.writeFileSync(debugPath, JSON.stringify(mergedFights, null, 2));
    console.log(`📄 Saved merged output for logId ${logId} to ${debugPath}`);

    // ✅ Queue for DB insert
    await postgresQueue.add("save-to-postgres", {
      logId,
      structuredFights: mergedFights,
    });

    return { message: "Merged and queued for DB insert", logId };
  },
  { connection: redisConnection }
);

mergeWorker.on("completed", (job) => {
  console.log(`✅ mergeWorker completed for logId ${job.data.logId}`);
});
mergeWorker.on("failed", (job, err) => {
  console.error(`❌ mergeWorker failed for logId ${job?.data?.logId}`, err);
});

console.log("🚀 Merge worker v3 started...");
