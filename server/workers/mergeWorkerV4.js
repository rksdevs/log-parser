// import { Worker } from "bullmq";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { postgresQueue } from "../queues/postgresQueue.js";
// import { redisConnection } from "../config/redis.js";
// import Redis from "ioredis";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const redisPublisher = new Redis(
//   process.env.REDIS_URL || "redis://localhost:6379"
// );

// const publishProgress = async (logId, stage, progress) => {
//   const message = JSON.stringify({ stage, progress });
//   console.log(`📬 mergeWorker progress: log:${logId} - ${stage}, ${progress}%`);
//   await redisPublisher.publish(`log:${logId}`, message);
// };

// function mergePetsIntoActors(structuredFights, petInstance) {
//   const petMetaMap = Object.values(petInstance.petsPerma || {});

//   for (const encounterName in structuredFights) {
//     const encounter = structuredFights[encounterName];

//     for (const bossName in encounter) {
//       const attempts = encounter[bossName];

//       for (const attempt of attempts) {
//         const { allActors } = attempt;
//         if (!allActors) continue;

//         for (const petMeta of petMetaMap) {
//           const { name: petName, master_name: ownerName } = petMeta;

//           if (!allActors[petName] || !allActors[ownerName]) continue;

//           if (!allActors[ownerName].pets) {
//             allActors[ownerName].pets = {};
//           }

//           allActors[ownerName].pets[petName] = allActors[petName];
//           delete allActors[petName];
//         }
//       }
//     }
//   }

//   return structuredFights;
// }

// const mergeWorker = new Worker(
//   "merge-worker",
//   async (job) => {
//     const { logId, structuredFights, selectedInstanceTime } = job.data;
//     console.log(`Merge worker initiated...${logId}`);
//     let mergedFights = structuredFights;
//     publishProgress(logId, "merging all segments", 50);
//     console.time("✅ Merge worker timer: ");
//     try {
//       // 🧠 Extract startTime from structuredFights
//       const enrichedStartTimes = Object.values(structuredFights)
//         .flatMap((bosses) =>
//           Object.values(bosses).map((attempts) => attempts[0]?.startTime)
//         )
//         .filter(Boolean)
//         .sort();

//       // const derivedStartTime = enrichedStartTimes[0]?.slice(0, 19); // "YYYY-MM-DD HH:mm:ss"

//       // if (!derivedStartTime) {
//       //   throw new Error(
//       //     "Could not determine encounterStartTime from structuredFights"
//       //   );
//       // }

//       const petsFilePath = path.join(
//         __dirname,
//         "../logs/pets",
//         `pets-log-${logId}.json`
//       );

//       console.log("✅ Pets file path from merge worker --- ", petsFilePath);
//       console.log("✅ selectedInstanceTime --- ", selectedInstanceTime);

//       try {
//         const petsContent = await fs.promises.readFile(petsFilePath, "utf8");
//         const petsData = JSON.parse(petsContent);

//         const matchingInstance = petsData.instances.find(
//           (i) => i.encounterStartTime === selectedInstanceTime
//         );

//         if (matchingInstance) {
//           console.log(
//             `🐾 Merging pets into structured fights for logId ${logId}`
//           );
//           mergedFights = mergePetsIntoActors(
//             structuredFights,
//             matchingInstance
//           );
//         } else {
//           console.warn(
//             `⚠️ No matching pet instance for ${selectedInstanceTime}`
//           );
//         }
//       } catch (err) {
//         console.warn(`⚠️ Pets file not found or unreadable: ${petsFilePath}`);
//       }
//     } catch (err) {
//       console.warn(`⚠️ Pet merge failed:`, err.message);
//     }

//     // 🧪 Debug output
//     const debugDir = path.join(__dirname, "../logs/mergesnippet");
//     if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

//     const debugPath = path.join(debugDir, `merge-log-${logId}.json`);
//     fs.writeFileSync(debugPath, JSON.stringify(mergedFights, null, 2));
//     console.log(`📄 Merged data saved to ${debugPath}`);
//     publishProgress(logId, "merge completed", 75);

//     // ✅ Push to DB queue
//     await postgresQueue.add("save-to-postgres", {
//       logId,
//       structuredFights: mergedFights,
//     });
//     console.timeEnd("✅ Merge worker timer: ");
//     return { message: "Merged and queued for DB insert", logId };
//   },
//   { connection: redisConnection }
// );

// mergeWorker.on("completed", (job) => {
//   console.log(`✅ mergeWorker completed for logId ${job.data.logId}`);
// });

// mergeWorker.on("failed", (job, err) => {
//   console.error(`❌ mergeWorker failed for logId ${job?.data?.logId}`, err);
// });

// console.log("🚀 Merge worker v4 started...");

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
  console.log(`📬 mergeWorker progress: log:${logId} - ${stage}, ${progress}%`);
  await redisPublisher.publish(`log:${logId}`, message);
};

function mergePetsIntoActors(structuredFights, petInstance) {
  const petMetaMap = Object.values(petInstance.petsPerma || {});

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

function mergeHealingData(structuredFights, healFights) {
  for (const encounterName in healFights) {
    const healEncounter = healFights[encounterName];
    const damageEncounter = structuredFights[encounterName] || {};

    for (const bossName in healEncounter) {
      const healAttempts = healEncounter[bossName];
      const damageAttempts = damageEncounter[bossName];

      if (!healAttempts || !damageAttempts) continue;

      for (let i = 0; i < healAttempts.length; i++) {
        const healAttempt = healAttempts[i];
        const damageAttempt = damageAttempts[i];

        if (!healAttempt || !damageAttempt) continue;

        damageAttempt.overallHealing = healAttempt.overallHealing;
        damageAttempt.healingByActors = healAttempt.healingByActors;

        const healActors = healAttempt.allActors || {};
        const damageActors = damageAttempt.allActors || {};

        for (const actorName in healActors) {
          const healer = healActors[actorName];

          if (!damageActors[actorName]) {
            // actor did only healing, not present in damage logs
            damageActors[actorName] = healer;
          } else {
            // merge healing data into existing actor
            const existing = damageActors[actorName];
            existing.class =
              existing.class === "Unknown" ? healer.class : existing.class;
            existing.healing = (existing.healing || 0) + (healer.healing || 0);

            for (const spellName in healer.spellList) {
              const healSpell = healer.spellList[spellName];
              if (!existing.spellList[spellName]) {
                existing.spellList[spellName] = healSpell;
              } else {
                const targetSpell = existing.spellList[spellName];

                targetSpell.totalCasts += healSpell.totalCasts;
                targetSpell.totalHits += healSpell.totalHits;
                targetSpell.amount += healSpell.amount;

                // merge healing fields
                if (healSpell.healing) {
                  if (!targetSpell.healing) targetSpell.healing = {};
                  for (const key in healSpell.healing) {
                    targetSpell.healing[key] =
                      (targetSpell.healing[key] || 0) +
                      (healSpell.healing[key] || 0);
                  }
                }
              }
            }
          }
        }

        damageAttempt.allActors = damageActors;
      }

      structuredFights[encounterName][bossName] = damageAttempts;
    }
  }

  return structuredFights;
}

const mergeWorker = new Worker(
  "merge-worker",
  async (job) => {
    const { logId, damageFights, healFights, selectedInstanceTime } = job.data;

    console.log(`Merge worker initiated...${logId}`);
    let mergedFights = damageFights;
    publishProgress(logId, "merging all segments", 50);
    console.time("✅ Merge worker timer: ");

    try {
      const petsFilePath = path.join(
        __dirname,
        "../logs/pets",
        `pets-log-${logId}.json`
      );

      console.log("✅ Pets file path from merge worker --- ", petsFilePath);
      console.log("✅ selectedInstanceTime --- ", selectedInstanceTime);

      try {
        const petsContent = await fs.promises.readFile(petsFilePath, "utf8");
        const petsData = JSON.parse(petsContent);

        const matchingInstance = petsData.instances.find(
          (i) => i.encounterStartTime === selectedInstanceTime
        );

        if (matchingInstance) {
          console.log(
            `🐾 Merging pets into structured fights for logId ${logId}`
          );
          mergedFights = mergePetsIntoActors(mergedFights, matchingInstance);
        } else {
          console.warn(
            `⚠️ No matching pet instance for ${selectedInstanceTime}`
          );
        }
      } catch (err) {
        console.warn(`⚠️ Pets file not found or unreadable: ${petsFilePath}`);
      }

      // ✅ Merge healing output into damage output
      mergedFights = mergeHealingData(mergedFights, healFights);
    } catch (err) {
      console.warn(`⚠️ Merge process failed:`, err.message);
    }

    // 🧪 Save merged output
    const debugDir = path.join(__dirname, "../logs/mergesnippet");
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

    const debugPath = path.join(debugDir, `merge-log-${logId}.json`);
    fs.writeFileSync(debugPath, JSON.stringify(mergedFights, null, 2));
    console.log(`📄 Merged data saved to ${debugPath}`);
    publishProgress(logId, "merge completed", 75);

    // 🚀 Push to DB queue
    await postgresQueue.add("save-to-postgres", {
      logId,
      structuredFights: mergedFights,
    });

    console.timeEnd("✅ Merge worker timer: ");
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

console.log("🚀 Merge worker v4 started...");

// const mergeAllData = async (logId) => {
//   // const { logId, damageFights, healFights, selectedInstanceTime } = job.data;

//   let selectedInstanceTime;

//   const damagePath = path.join(
//     __dirname,
//     "..",
//     "logs",
//     "json",
//     `log-572-parsed.json`
//   );

//   const healPath = path.join(
//     __dirname,
//     "..",
//     "logs",
//     "heal",
//     `heal-log-372.json`
//   );

//   if (!fs.existsSync(damagePath)) {
//     return res.status(404).json({ error: "Damage data file missing" });
//   }

//   if (!fs.existsSync(healPath)) {
//     return res.status(404).json({ error: "Heal data file missing" });
//   }

//   const damageJson = JSON.parse(fs.readFileSync(damagePath, "utf-8"));
//   const healJson = JSON.parse(fs.readFileSync(healPath, "utf-8"));

//   const structuredFightsFromDamage = damageJson?.[0]?.fights;
//   const structuredFightsFromHeal = healJson?.[0]?.fights;

//   const encounterStartTimeDamage = damageJson?.[0]?.encounterStartTime;
//   const encounterStartTimeHeal = healJson?.[0]?.encounterStartTime;

//   if (!structuredFightsFromDamage) {
//     return res
//       .status(404)
//       .json({ error: "No structured fights from damage output were found" });
//   }

//   if (!structuredFightsFromHeal) {
//     return res
//       .status(404)
//       .json({ error: "No structured fights from heal output were found" });
//   }

//   if (encounterStartTimeDamage !== encounterStartTimeHeal) {
//     return res.status(404).json({
//       error: "Encounter start time mismatch between damage and heal",
//     });
//   } else {
//     selectedInstanceTime = encounterStartTimeDamage || encounterStartTimeHeal;
//   }

//   console.log(`Merge worker initiated...${logId}`);
//   let mergedFights = structuredFightsFromDamage;
//   // publishProgress(logId, "merging all segments", 50);
//   console.time("✅ Merge worker timer: ");

//   try {
//     const petsFilePath = path.join(
//       __dirname,
//       "../logs/pets",
//       `pets-log-372.json`
//     );

//     console.log("✅ Pets file path from merge worker --- ", petsFilePath);
//     console.log("✅ selectedInstanceTime --- ", selectedInstanceTime);

//     try {
//       const petsContent = await fs.promises.readFile(petsFilePath, "utf8");
//       const petsData = JSON.parse(petsContent);

//       const matchingInstance = petsData.instances.find(
//         (i) => i.encounterStartTime === selectedInstanceTime
//       );

//       if (matchingInstance) {
//         console.log(
//           `🐾 Merging pets into structured fights for logId ${logId}`
//         );
//         mergedFights = mergePetsIntoActors(mergedFights, matchingInstance);
//       } else {
//         console.warn(`⚠️ No matching pet instance for ${selectedInstanceTime}`);
//       }
//     } catch (err) {
//       console.warn(`⚠️ Pets file not found or unreadable: ${petsFilePath}`);
//     }

//     // ✅ Merge healing output into damage output
//     mergedFights = mergeHealingData(mergedFights, structuredFightsFromHeal);
//   } catch (err) {
//     console.warn(`⚠️ Merge process failed:`, err.message);
//   }

//   // 🧪 Save merged output
//   const debugDir = path.join(__dirname, "../logs/mergesnippet");
//   if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

//   const debugPath = path.join(debugDir, `merge-log-${logId}.json`);
//   fs.writeFileSync(debugPath, JSON.stringify(mergedFights, null, 2));
//   console.log(`📄 Merged data saved to ${debugPath}`);
//   // publishProgress(logId, "merge completed", 75);

//   // 🚀 Push to DB queue
//   // await postgresQueue.add("save-to-postgres", {
//   //   logId,
//   //   structuredFights: mergedFights,
//   // });

//   console.timeEnd("✅ Merge worker timer: ");
//   return { message: "Merged and queued for DB insert", logId };
// };

// mergeAllData(400);
