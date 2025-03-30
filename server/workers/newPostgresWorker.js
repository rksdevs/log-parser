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
    const { logId, structuredFights } = job.data;
    console.log(`🚀 Processing PostgreSQL save for log ID: ${logId}`);

    try {
      const logEntry = await prisma.logs.findUnique({ where: { logId } });
      if (!logEntry) {
        console.error(`❌ Log ID ${logId} not found in PostgreSQL!`);
        return;
      }

      let encounterInserts = [];
      let bossInserts = [];
      let attemptInserts = [];
      let allActorInserts = [];
      let spellStatisticInserts = [];
      let attemptParticipantInserts = [];

      publishProgress(logId, "saving to database", 10);
      console.log(`📌 Fetching existing players from DB...`);
      const existingPlayers = await prisma.player.findMany({
        select: { id: true, name: true },
      });
      let playerMap = new Map(existingPlayers.map((p) => [p.name, p.id]));

      const newPlayers = new Set();
      const uniquePlayersData = [];

      for (const encounterName in structuredFights) {
        // console.log(encounterName, "encounter name");
        for (const bossName in structuredFights[encounterName]) {
          // console.log(bossName, "boss name");
          // if (!Array.isArray(attempts)) {
          //   console.warn(
          //     `⚠️ Skipping boss ${bossName} in encounter ${encounterName} — not iterable`
          //   );
          //   continue;
          // }
          for (const attempt of structuredFights[encounterName][bossName]) {
            // console.log(attempt, "attempt name");

            for (const actorName in attempt.allActors) {
              if (!playerMap.has(actorName)) {
                const isLikelyPlayer =
                  actorName.length > 2 &&
                  actorName[0] === actorName[0].toUpperCase();
                if (isLikelyPlayer && !newPlayers.has(actorName)) {
                  newPlayers.add(actorName);
                  uniquePlayersData.push({
                    name: actorName,
                    class: attempt.allActors[actorName].class || "Unknown",
                  });
                }
              }
            }
          }
        }
      }

      if (uniquePlayersData.length > 0) {
        console.log(`📌 Inserting ${uniquePlayersData.length} new players...`);
        await prisma.player.createMany({ data: uniquePlayersData });
        const updatedPlayers = await prisma.player.findMany({
          select: { id: true, name: true },
        });
        playerMap = new Map(updatedPlayers.map((p) => [p.name, p.id]));
      }

      publishProgress(logId, "saving to database", 30);

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
              startTime: new Date(attempt.startTime),
              endTime: new Date(attempt.endTime),
              overallDamage: attempt.overallDamage || 0,
              overallHealing: attempt.overallHealing || 0,
              damageByActors: JSON.stringify(attempt.damageByActors || {}),
              healingByActors: JSON.stringify(attempt.healingByActors || {}),
            });

            for (const actorName in attempt.allActors) {
              const actor = attempt.allActors[actorName];
              const playerId = playerMap.get(actorName) || null;

              allActorInserts.push({
                attemptId,
                actorName,
                class: actor.class || "Unknown",
                actorDamage: actor.actorDamage || 0,
                actorTotalDamage: actor.actorTotalDamage || 0,
                actorDamage: actor.actorDamage || 0,
                actorTotalDamage: actor.actorTotalDamage || 0,
                healing: actor.healing || 0,
                pets: Object.keys(actor.pets || {}),
                // spellList: actor.spellList || {},
              });

              if (playerId) {
                for (const spellName in actor.spellList) {
                  const spell = actor.spellList[spellName];

                  spellStatisticInserts.push({
                    attemptId,
                    playerId,
                    playerName: actorName,
                    spellId: spell.spellId,
                    spellName,
                    totalDamage: spell.totalDamage,
                    usefulDamage: spell.usefulDamage,
                    totalCasts: spell.totalCasts,
                    normalHits: spell.normalHits,
                    criticalHits: spell.criticalHits,
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
                  damageDone: actor.actorDamage || 0,
                  healingDone: actor.healing || 0,
                });
              }
            }
          }
        }
      }

      publishProgress(logId, "saving to database", 50);

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

      const firstEncounter =
        structuredFights &&
        Object.keys(structuredFights).length > 0 &&
        Object.values(structuredFights)[0]?.[
          Object.keys(Object.values(structuredFights)[0])[0]
        ]?.[0]?.startTime
          ? new Date(
              Object.values(structuredFights)[0][
                Object.keys(
                  structuredFights[Object.keys(structuredFights)[0]]
                )[0]
              ][0].startTime
            )
          : null;

      const allPlayersSet = new Set();
      for (const encounter of Object.values(structuredFights)) {
        for (const boss of Object.values(encounter)) {
          for (const attempt of boss) {
            Object.keys(attempt.allActors).forEach((actor) => {
              if (playerMap.has(actor)) allPlayersSet.add(actor);
            });
          }
        }
      }

      //   const allPlayersArray = [...allPlayersSet];
      const allPlayersArray = [...allPlayersSet].filter(
        (player) => typeof player === "string" && player.trim() !== ""
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
          log: {
            connect: {
              logId,
            },
          },
        },
      });

      console.log(`✅ Log stored in LogsMain with ID: ${logId}`);
      publishProgress(logId, "saving to database completed", 100);
    } catch (error) {
      console.error("❌ Error saving log to PostgreSQL:", error);
      await prisma.logs.update({
        where: { logId },
        data: {
          uploadStatus: "failed",
          dbUploadCompleteAt: new Date(),
        },
      });
      publishProgress(logId, "error", error.message);
    }
  },
  { connection: redisConnection }
);

console.log("🚀 Optimized PostgreSQL save worker started...");
export default postgresWorker;
