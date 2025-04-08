//working as of 6-4-25
// import { Worker } from "bullmq";
// import { redisConnection } from "../config/redis.js";
// import { PrismaClient } from "@prisma/client";
// import Redis from "ioredis";
// import { getSpellIconName } from "../helpers/spellIconHelper.js";

// const prisma = new PrismaClient();
// const redisPublisher = new Redis(
//   process.env.REDIS_URL || "redis://localhost:6379"
// );

// const publishProgress = async (logId, stage, progress) => {
//   const message = JSON.stringify({ stage, progress });
//   console.log(
//     `🚀 Publishing progress update to Redis: log:${logId} - ${stage} (${progress}%)`
//   );
//   await redisPublisher.publish(`log:${logId}`, message);
// };

// const postgresWorker = new Worker(
//   "save-to-postgres-db-queue",
//   async (job) => {
//     const { structuredFights } = job.data;
//     let { logId } = job.data;
//     console.log(`🚀 Processing PostgreSQL save for log ID: ${logId}`);
//     logId = parseInt(logId);
//     try {
//       // const logEntry = await prisma.logs.findUnique({ where: { logId } });
//       // const logIdInt = parseInt(logId);
//       const logEntry = await prisma.logs.findUnique({
//         where: { logId },
//       });
//       if (!logEntry) {
//         console.error(`❌ Log ID ${logId} not found in PostgreSQL!`);
//         return;
//       }

//       publishProgress(logId, "Saving to database", 80);

//       const existingPlayers = await prisma.player.findMany({
//         select: { id: true, name: true, guid: true },
//       });

//       const playerMap = new Map(
//         existingPlayers.map((p) => [`${p.name}_${p.guid || ""}`, p.id])
//       );

//       const newPlayers = new Set();
//       const uniquePlayersData = [];

//       let encounterInserts = [];
//       let bossInserts = [];
//       let attemptInserts = [];
//       let allActorInserts = [];
//       let spellStatisticInserts = [];
//       let attemptParticipantInserts = [];

//       for (const encounterName in structuredFights) {
//         for (const bossName in structuredFights[encounterName]) {
//           for (const attempt of structuredFights[encounterName][bossName]) {
//             for (const actorName in attempt.allActors) {
//               const actor = attempt.allActors[actorName];
//               const guidKey = `${actorName}_${actor.guid || ""}`;
//               const isLikelyPlayer =
//                 actorName.length > 2 &&
//                 actorName[0] === actorName[0].toUpperCase();

//               if (
//                 isLikelyPlayer &&
//                 !playerMap.has(guidKey) &&
//                 !newPlayers.has(guidKey)
//               ) {
//                 newPlayers.add(guidKey);
//                 uniquePlayersData.push({
//                   name: actorName,
//                   class: actor.class || "Unknown",
//                   guid: actor.guid || null,
//                 });
//               }
//             }
//           }
//         }
//       }

//       if (uniquePlayersData.length > 0) {
//         console.log(`📌 Inserting ${uniquePlayersData.length} new players...`);
//         await prisma.player.createMany({ data: uniquePlayersData });
//         const updatedPlayers = await prisma.player.findMany({
//           select: { id: true, name: true, guid: true },
//         });
//         updatedPlayers.forEach((p) =>
//           playerMap.set(`${p.name}_${p.guid || ""}`, p.id)
//         );
//       }

//       publishProgress(logId, "Saving to database", 90);

//       for (const encounterName in structuredFights) {
//         const bosses = structuredFights[encounterName];
//         const encounterId = `${logId}-${encounterInserts.length + 1}`;
//         encounterInserts.push({ id: encounterId, name: encounterName, logId });

//         for (const bossName in bosses) {
//           const attempts = bosses[bossName];
//           const bossId = `${logId}-${bossInserts.length + 1}`;
//           bossInserts.push({ id: bossId, name: bossName, encounterId });

//           for (const attempt of attempts) {
//             const attemptId = `${logId}-${attemptInserts.length + 1}`;

//             attemptInserts.push({
//               id: attemptId,
//               bossId,
//               name: attempt.name || null,
//               type: ["kill", "wipe"].includes(attempt.type)
//                 ? attempt.type
//                 : null,
//               startTime: new Date(attempt.startTime),
//               endTime: new Date(attempt.endTime),
//               startMs: BigInt(attempt.startMs || 0),
//               endMs: BigInt(attempt.endMs || 0),
//               lineStart: attempt.lineStart || null,
//               lineEnd: attempt.lineEnd || null,
//               overallDamage: attempt.overallDamage || 0,
//               overallHealing: attempt.overallHealing || 0,
//               damageByActors: JSON.stringify(attempt.damageByActors || {}),
//               healingByActors: JSON.stringify(attempt.healingByActors || {}),
//             });

//             for (const actorName in attempt.allActors) {
//               const actor = attempt.allActors[actorName];
//               const guidKey = `${actorName}_${actor.guid || ""}`;
//               const playerId = playerMap.get(guidKey) || null;

//               allActorInserts.push({
//                 attemptId,
//                 actorName,
//                 data: actor,
//               });

//               if (playerId) {
//                 for (const spellName in actor.spellList) {
//                   const spell = actor.spellList[spellName];
//                   spellStatisticInserts.push({
//                     attemptId,
//                     playerId,
//                     playerName: actorName,
//                     spellId: spell.spellId,
//                     spellName,
//                     totalDamage: spell.totalDamage || 0,
//                     usefulDamage: spell.usefulDamage,
//                     totalCasts: spell.totalCasts,
//                     normalHits: spell.normalHits,
//                     criticalHits: spell.criticalHits,
//                     periodicHits: spell.periodicHits || 0,
//                     periodicCrits: spell.periodicCrits || 0,
//                     icon:
//                       spell.spellName === "Melee"
//                         ? "Melee"
//                         : getSpellIconName(spell.spellId),
//                   });
//                 }

//                 attemptParticipantInserts.push({
//                   attemptId,
//                   playerId,
//                   damageDone:
//                     (actor.actorDamage || 0) +
//                     Object.values(actor.pets || {}).reduce(
//                       (acc, pet) => acc + (pet.actorDamage || 0),
//                       0
//                     ),
//                   healingDone: actor.healing || 0,
//                 });
//               }
//             }
//           }
//         }
//       }

//       publishProgress(logId, "Saving to database", 95);

//       console.log(`📌 Inserting ${encounterInserts.length} encounters...`);
//       await prisma.encounter.createMany({ data: encounterInserts });

//       console.log(`📌 Inserting ${bossInserts.length} bosses...`);
//       await prisma.boss.createMany({ data: bossInserts });

//       console.log(`📌 Inserting ${attemptInserts.length} attempts...`);
//       await prisma.attempt.createMany({ data: attemptInserts });

//       console.log(`📌 Inserting ${allActorInserts.length} allActors...`);
//       await prisma.allActor.createMany({ data: allActorInserts });

//       console.log(
//         `📌 Inserting ${spellStatisticInserts.length} spell statistics...`
//       );
//       await prisma.spellStatistic.createMany({ data: spellStatisticInserts });

//       console.log(
//         `📌 Inserting ${attemptParticipantInserts.length} attempt participants...`
//       );
//       await prisma.attemptParticipant.createMany({
//         data: attemptParticipantInserts,
//       });

//       const firstEncounter = Object.values(structuredFights)?.[0]?.[
//         Object.keys(Object.values(structuredFights)[0])[0]
//       ]?.[0]?.startTime
//         ? new Date(
//             Object.values(structuredFights)[0][
//               Object.keys(Object.values(structuredFights)[0])[0]
//             ][0].startTime
//           )
//         : null;

//       const allPlayersSet = new Set();
//       for (const encounter of Object.values(structuredFights)) {
//         for (const boss of Object.values(encounter)) {
//           for (const attempt of boss) {
//             Object.entries(attempt.allActors).forEach(([name, actor]) => {
//               const key = `${name}_${actor.guid || ""}`;
//               if (playerMap.has(key)) allPlayersSet.add(name);
//             });
//           }
//         }
//       }

//       const allPlayersArray = [...allPlayersSet].filter(
//         (p) => typeof p === "string" && p.trim() !== ""
//       );

//       await prisma.logs.update({
//         where: { logId },
//         data: {
//           uploadStatus: "completed",
//           dbUploadCompleteAt: new Date(),
//           processingStatus: "completed",
//         },
//       });

//       await prisma.logsMain.create({
//         data: {
//           firstEncounter,
//           playersInvolved: JSON.stringify(allPlayersArray),
//           uploadStatus: "completed",
//           log: { connect: { logId } },
//         },
//       });

//       console.log(`✅ Log stored in LogsMain with ID: ${logId}`);
//       publishProgress(logId, "saving to database completed", 100);
//     } catch (error) {
//       console.error("❌ Error saving log to PostgreSQL:", error);
//       await prisma.logs.update({
//         where: { logId: job.data.logId },
//         data: {
//           uploadStatus: "failed",
//           dbUploadCompleteAt: new Date(),
//         },
//       });
//       publishProgress(job.data.logId, "error", error.message);
//     }
//   },
//   { connection: redisConnection }
// );

// console.log("🚀 Optimized PostgreSQL save worker started...");
// export default postgresWorker;

import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { getSpellIconName } from "../helpers/spellIconHelper.js";

const prisma = new PrismaClient();
const redisPublisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

const publishProgress = async (logId, stage, progress) => {
  const message = JSON.stringify({ stage, progress });
  console.log(
    `🚀 Publishing progress update to Redis: log:${logId} - ${stage} (${progress}%)`
  );
  await redisPublisher.publish(`log:${logId}`, message);
};

const postgresWorker = new Worker(
  "save-to-postgres-db-queue",
  async (job) => {
    const { structuredFights } = job.data;
    let { logId } = job.data;
    console.log(`🚀 Processing PostgreSQL save for log ID: ${logId}`);
    logId = parseInt(logId);
    try {
      const logEntry = await prisma.logs.findUnique({ where: { logId } });
      if (!logEntry) {
        console.error(`❌ Log ID ${logId} not found in PostgreSQL!`);
        return;
      }

      publishProgress(logId, "Saving to database", 80);

      const existingPlayers = await prisma.player.findMany({
        select: { id: true, name: true, guid: true },
      });

      const playerMap = new Map(
        existingPlayers.map((p) => [`${p.name}_${p.guid || ""}`, p.id])
      );

      const newPlayers = new Set();
      const uniquePlayersData = [];

      let encounterInserts = [];
      let bossInserts = [];
      let attemptInserts = [];
      let allActorInserts = [];
      let spellStatisticInserts = [];
      let attemptParticipantInserts = [];

      for (const encounterName in structuredFights) {
        for (const bossName in structuredFights[encounterName]) {
          for (const attempt of structuredFights[encounterName][bossName]) {
            for (const actorName in attempt.allActors) {
              const actor = attempt.allActors[actorName];
              const guidKey = `${actorName}_${actor.guid || ""}`;
              const isLikelyPlayer =
                actorName.length > 2 &&
                actorName[0] === actorName[0].toUpperCase();

              if (
                isLikelyPlayer &&
                !playerMap.has(guidKey) &&
                !newPlayers.has(guidKey)
              ) {
                newPlayers.add(guidKey);
                uniquePlayersData.push({
                  name: actorName,
                  class: actor.class || "Unknown",
                  guid: actor.guid || null,
                });
              }
            }
          }
        }
      }

      if (uniquePlayersData.length > 0) {
        console.log(`📌 Inserting ${uniquePlayersData.length} new players...`);
        await prisma.player.createMany({ data: uniquePlayersData });
        const updatedPlayers = await prisma.player.findMany({
          select: { id: true, name: true, guid: true },
        });
        updatedPlayers.forEach((p) =>
          playerMap.set(`${p.name}_${p.guid || ""}`, p.id)
        );
      }

      publishProgress(logId, "Saving to database", 90);

      for (const encounterName in structuredFights) {
        const bosses = structuredFights[encounterName];
        const encounterId = `${logId}-${encounterInserts.length + 1}`;
        encounterInserts.push({ id: encounterId, name: encounterName, logId });

        for (const bossName in bosses) {
          const attempts = bosses[bossName];
          const bossId = `${logId}-${bossInserts.length + 1}`;
          bossInserts.push({ id: bossId, name: bossName, encounterId });

          for (const attempt of attempts) {
            const attemptId = `${logId}-${attemptInserts.length + 1}`;

            attemptInserts.push({
              id: attemptId,
              bossId,
              name: attempt.name || null,
              type: ["kill", "wipe"].includes(attempt.type)
                ? attempt.type
                : null,
              startTime: new Date(attempt.startTime),
              endTime: new Date(attempt.endTime),
              startMs: BigInt(attempt.startMs || 0),
              endMs: BigInt(attempt.endMs || 0),
              lineStart: attempt.lineStart || null,
              lineEnd: attempt.lineEnd || null,
              overallDamage: attempt.overallDamage || 0,
              overallHealing: attempt.overallHealing || 0,
              damageByActors: JSON.stringify(attempt.damageByActors || {}),
              healingByActors: JSON.stringify(attempt.healingByActors || {}),
            });

            for (const actorName in attempt.allActors) {
              const actor = attempt.allActors[actorName];
              const guidKey = `${actorName}_${actor.guid || ""}`;
              const playerId = playerMap.get(guidKey) || null;

              allActorInserts.push({
                attemptId,
                actorName,
                data: actor,
              });

              if (playerId) {
                for (const spellName in actor.spellList || {}) {
                  const spell = actor.spellList[spellName];

                  const totalDamage =
                    spell?.damage?.useful || spell?.usefulDamage || 0;
                  const totalCasts = spell?.totalCasts || 0;
                  const normalHits =
                    spell?.damage?.normalHits || spell?.normalHits || 0;
                  const criticalHits =
                    spell?.damage?.crits || spell?.criticalHits || 0;

                  spellStatisticInserts.push({
                    attemptId,
                    playerId,
                    playerName: actorName,
                    spellId: `${spell.spellId || 0}`,
                    spellName: spell.spellName || spellName,
                    totalDamage,
                    usefulDamage: totalDamage,
                    totalCasts,
                    normalHits,
                    criticalHits,
                    periodicHits: spell.periodicHits || 0,
                    periodicCrits: spell.periodicCrits || 0,
                    icon:
                      spell.spellName === "Melee"
                        ? "Melee"
                        : getSpellIconName(spell.spellId),
                  });
                }

                attemptParticipantInserts.push({
                  attemptId,
                  playerId,
                  damageDone:
                    (actor.actorDamage || 0) +
                    Object.values(actor.pets || {}).reduce(
                      (acc, pet) => acc + (pet.actorDamage || 0),
                      0
                    ),
                  healingDone: actor.healing || 0,
                });
              }
            }
          }
        }
      }

      publishProgress(logId, "Saving to database", 95);

      console.log(`📌 Inserting ${encounterInserts.length} encounters...`);
      await prisma.encounter.createMany({ data: encounterInserts });

      console.log(`📌 Inserting ${bossInserts.length} bosses...`);
      await prisma.boss.createMany({ data: bossInserts });

      console.log(`📌 Inserting ${attemptInserts.length} attempts...`);
      await prisma.attempt.createMany({ data: attemptInserts });

      console.log(`📌 Inserting ${allActorInserts.length} allActors...`);
      await prisma.allActor.createMany({ data: allActorInserts });

      console.log(
        `📌 Inserting ${spellStatisticInserts.length} spell statistics...`
      );
      await prisma.spellStatistic.createMany({ data: spellStatisticInserts });

      console.log(
        `📌 Inserting ${attemptParticipantInserts.length} attempt participants...`
      );
      await prisma.attemptParticipant.createMany({
        data: attemptParticipantInserts,
      });

      const firstEncounter = Object.values(structuredFights)?.[0]?.[
        Object.keys(Object.values(structuredFights)[0])[0]
      ]?.[0]?.startTime
        ? new Date(
            Object.values(structuredFights)[0][
              Object.keys(Object.values(structuredFights)[0])[0]
            ][0].startTime
          )
        : null;

      const allPlayersSet = new Set();
      for (const encounter of Object.values(structuredFights)) {
        for (const boss of Object.values(encounter)) {
          for (const attempt of boss) {
            Object.entries(attempt.allActors).forEach(([name, actor]) => {
              const key = `${name}_${actor.guid || ""}`;
              if (playerMap.has(key)) allPlayersSet.add(name);
            });
          }
        }
      }

      const allPlayersArray = [...allPlayersSet].filter(
        (p) => typeof p === "string" && p.trim() !== ""
      );

      await prisma.logs.update({
        where: { logId },
        data: {
          uploadStatus: "completed",
          dbUploadCompleteAt: new Date(),
          processingStatus: "completed",
        },
      });

      await prisma.logsMain.create({
        data: {
          firstEncounter,
          playersInvolved: JSON.stringify(allPlayersArray),
          uploadStatus: "completed",
          log: { connect: { logId } },
        },
      });

      console.log(`✅ Log stored in LogsMain with ID: ${logId}`);
      publishProgress(logId, "saving to database completed", 100);
    } catch (error) {
      console.error("❌ Error saving log to PostgreSQL:", error);
      await prisma.logs.update({
        where: { logId: job.data.logId },
        data: {
          uploadStatus: "failed",
          dbUploadCompleteAt: new Date(),
        },
      });
      publishProgress(job.data.logId, "error", error.message);
    }
  },
  { connection: redisConnection }
);

console.log("🚀 Optimized PostgreSQL save worker started...");
export default postgresWorker;
