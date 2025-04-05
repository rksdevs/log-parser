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
  console.log(`Damage worker log:${logId} - ${stage}, ${progress}`);
  await redisPublisher.publish(`log:${logId}`, message);
};

function mergePetsIntoActors(structuredFights, petInstance) {
  const petMetaMap = Object.values(petInstance.petsPerma); // [{ name, master_name }, ...]

  for (const encounterName in structuredFights) {
    const encounter = structuredFights[encounterName];

    for (const bossName in encounter) {
      const attempts = encounter[bossName];

      for (const attempt of attempts) {
        const { allActors } = attempt;
        if (!allActors) continue;

        for (const petMeta of petMetaMap) {
          const { name: petName, master_name: ownerName } = petMeta;

          if (!allActors[petName]) {
            // console.warn("⚠️ Pet missing from allActors:", petName);
            continue;
          }
          if (!allActors[ownerName]) {
            // console.warn("⚠️ Owner missing from allActors:", ownerName);
            continue;
          }

          if (!allActors[ownerName].pets) {
            allActors[ownerName].pets = {};
          }

          // Attach pet to owner and remove from top-level
          allActors[ownerName].pets[petName] = allActors[petName];
          delete allActors[petName];

          //   console.log(`✅ Merged pet "${petName}" into owner "${ownerName}"`);
        }

        // console.log("✅ Final actor keys for attempt:", Object.keys(allActors));
      }
    }
  }

  return structuredFights;
}

const mergeWorker = new Worker(
  "merge-worker",
  async (job) => {
    const { logId, selectedInstanceTime, structuredFights } = job.data;

    const petsFilePath = path.join(
      __dirname,
      "../logs/pets",
      `pets-log-${logId}.json`
    );
    if (!fs.existsSync(petsFilePath)) {
      throw new Error(`Pets file not found for logId ${logId}`);
    }

    const petsData = JSON.parse(fs.readFileSync(petsFilePath, "utf8"));
    // console.log("✅ Pets data: ", petsData);

    const match = petsData.instances.find(
      (instance) => instance.encounterStartTime === selectedInstanceTime
    );

    if (!match) {
      publishProgress(
        logId,
        "error",
        `Matching pet instance not found for encounterStartTime: ${selectedInstanceTime}`
      );
      throw new Error(
        `Matching pet instance not found for encounterStartTime: ${selectedInstanceTime}`
      );
    }

    // console.log(
    //   `🐾 Merging pet data into structured fights for logId ${logId}`
    // );

    // 🧪 Dump raw structuredFights BEFORE merge
    const rawDebugDir = path.join(__dirname, "../logs/raw-structured");
    if (!fs.existsSync(rawDebugDir))
      fs.mkdirSync(rawDebugDir, { recursive: true });
    const rawPath = path.join(rawDebugDir, `raw-log-${logId}.json`);
    fs.writeFileSync(rawPath, JSON.stringify(structuredFights, null, 2));
    // console.log(`🧪 Dumped raw structuredFights to ${rawPath}`);

    // Optional sample log
    // const sampleActor =
    //   Object.entries(structuredFights)?.[0]?.[1]?.[
    //     Object.keys(Object.entries(structuredFights)?.[0]?.[1])?.[0]
    //   ]?.[0]?.allActors?.["Inno"];
    // console.log("🧪 Sample actor (Inno):", sampleActor);

    // const allActorsBlock =
    //   Object.entries(structuredFights)?.[0]?.[1]?.[
    //     Object.keys(Object.entries(structuredFights)?.[0]?.[1])?.[0]
    //   ]?.[0]?.allActors;
    // console.log("✅ allActors structure:", allActorsBlock);

    // 🔄 Merge pets into actors
    const merged = mergePetsIntoActors(structuredFights, match);

    // ✅ Save merged output
    const debugDir = path.join(__dirname, "../logs/mergesnippet");
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

    const debugPath = path.join(debugDir, `merge-log-${logId}.json`);
    fs.writeFileSync(debugPath, JSON.stringify(merged, null, 2));
    console.log(`📄 Saved merged output for logId ${logId} to ${debugPath}`);

    // ✅ Queue for DB insert
    await postgresQueue.add("save-to-postgres", {
      logId,
      structuredFights: merged,
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

console.log("Merge worker started.....");
