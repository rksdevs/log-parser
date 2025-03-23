import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { getSpellIconName } from "../helpers/spellIconHelper.js";

const prisma = new PrismaClient();
const redisPublisher = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

// ✅ Function to Publish Events to Redis Instead of Emitting Directly
const publishProgress = async (logId, stage, progress) => {
  const message = JSON.stringify({ stage, progress });
  console.log(
    `🚀 Publishing progress update to Redis: log:${logId} - ${stage} (${progress}%)`
  );
  await redisPublisher.publish(`log:${logId}`, message);
};

const postgresWorker = new Worker(
  "postgres-save-queue",
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
      let attemptParticipantInserts = [];
      let spellStatisticInserts = [];
      let logInserts = [];

      /** ==========================
       * 1️⃣ Fetch Existing Players in Bulk
       ========================== **/
      console.log(`📌 Fetching existing players from DB...`);
      let existingPlayers = await prisma.player.findMany({
        select: { id: true, name: true },
      });
      let playerMap = new Map(existingPlayers.map((p) => [p.name, p.id]));

      /** ==========================
       * 2️⃣ Collect Unique Players Before Insert
       ========================== **/
      let newPlayers = new Set(); // Store unique player names
      let uniquePlayersData = []; // Prepare player insert data

      publishProgress(logId, "saving to database", 20);

      for (const encounterName in structuredFights) {
        for (const bossName in structuredFights[encounterName]) {
          for (const attempt of structuredFights[encounterName][bossName]) {
            for (const playerName in attempt.players) {
              if (!playerMap.has(playerName)) {
                if (!newPlayers.has(playerName)) {
                  newPlayers.add(playerName);
                  uniquePlayersData.push({
                    name: playerName,
                    class: attempt.players[playerName].class,
                  });
                }
              }
            }
          }
        }
      }

      /** ==========================
       * 3️⃣ Bulk Insert New Players & Update `playerMap`
       ========================== **/
      if (uniquePlayersData.length > 0) {
        console.log(`📌 Inserting ${uniquePlayersData.length} new players...`);
        await prisma.player.createMany({ data: uniquePlayersData });

        // Fetch all players again and update the `playerMap`
        let updatedPlayers = await prisma.player.findMany({
          select: { id: true, name: true },
        });
        playerMap = new Map(updatedPlayers.map((p) => [p.name, p.id]));
      }

      /** ==========================
       * 4️⃣ Process Encounters, Attempts & AttemptParticipants Efficiently
       ========================== **/
      for (const encounterName in structuredFights) {
        const bosses = structuredFights[encounterName];

        // Prepare encounter insert
        const encounterId = `${logId}-${encounterInserts.length + 1}`;
        encounterInserts.push({ id: encounterId, name: encounterName, logId });

        for (const bossName in bosses) {
          const attempts = bosses[bossName];

          // Prepare boss insert
          const bossId = `${logId}-${bossInserts.length + 1}`;
          bossInserts.push({ id: bossId, name: bossName, encounterId });

          for (const attempt of attempts) {
            const attemptId = `${logId}-${attemptInserts.length + 1}`;
            attemptInserts.push({
              id: attemptId,
              bossId,
              startTime: new Date(attempt.startTime),
              endTime: new Date(attempt.endTime),
              totalDamage: attempt.overallDamage || 0,
              totalHealing: 0,
            });

            for (const playerName in attempt.players) {
              let playerId = playerMap.get(playerName);

              if (!playerId) {
                console.error(`❌ Player ${playerName} not found! Skipping.`);
                continue; // Skip if player isn't found (shouldn't happen)
              }

              attemptParticipantInserts.push({
                attemptId,
                playerId,
                damageDone: attempt.damageByPlayer[playerName] || 0,
                healingDone: attempt.players[playerName].healing || 0,
              });

              // Process Spell Statistics
              for (const spell in attempt.players[playerName].spellList) {
                spellStatisticInserts.push({
                  attemptId,
                  playerId,
                  playerName,
                  spellId: attempt.players[playerName].spellList[spell].spellId,
                  spellName:
                    attempt.players[playerName].spellList[spell].spellName,
                  totalDamage:
                    attempt.players[playerName].spellList[spell].totalDamage,
                  usefulDamage:
                    attempt.players[playerName].spellList[spell].usefulDamage,
                  totalCasts:
                    attempt.players[playerName].spellList[spell].totalCasts,
                  normalHits:
                    attempt.players[playerName].spellList[spell].normalHits,
                  criticalHits:
                    attempt.players[playerName].spellList[spell].criticalHits,
                  icon:
                    attempt.players[playerName].spellList[spell].spellName ===
                    "Melee"
                      ? "Melee"
                      : getSpellIconName(
                          attempt.players[playerName].spellList[spell].spellId
                        ),
                });
              }
            }
          }
        }
      }

      publishProgress(logId, "saving to database", 50);

      /** ==========================
       * 5️⃣ Bulk Insert Data Efficiently
       ========================== **/
      console.log(`📌 Inserting ${encounterInserts.length} encounters...`);
      await prisma.encounter.createMany({ data: encounterInserts });

      console.log(`📌 Inserting ${bossInserts.length} bosses...`);
      await prisma.boss.createMany({ data: bossInserts });

      console.log(`📌 Inserting ${attemptInserts.length} attempts...`);
      await prisma.attempt.createMany({ data: attemptInserts });

      console.log(
        `📌 Inserting ${attemptParticipantInserts.length} attempt participants...`
      );
      await prisma.attemptParticipant.createMany({
        data: attemptParticipantInserts,
      });

      console.log(
        `📌 Inserting ${spellStatisticInserts.length} spell statistics...`
      );
      await prisma.spellStatistic.createMany({ data: spellStatisticInserts });

      console.log(`✅ PostgreSQL save completed for log ID: ${logId}`);

      publishProgress(logId, "saving to database", 90);

      // await prisma.logs.update({
      //   where: { logId },
      //   data: { uploadStatus: "completed", dbUploadCompleteAt: new Date() },
      // });

      const firstEncounter =
        structuredFights && Object.keys(structuredFights).length > 0
          ? new Date(
              Object.values(structuredFights)[0]?.[
                Object.keys(Object.values(structuredFights)[0])[0]
              ]?.[0]?.startTime
            )
          : null;

      // Get list of players in the log
      const allPlayers = new Set();
      for (const encounter of Object.values(structuredFights)) {
        for (const boss of Object.values(encounter)) {
          for (const attempt of boss) {
            Object.keys(attempt.players).forEach((player) =>
              allPlayers.add(player)
            );
          }
        }
      }

      const allPlayersArray = [...allPlayers].filter(
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

      // ✅ Store log reference in LogsMain
      await prisma.logsMain.create({
        data: {
          logId,
          firstEncounter,
          playersInvolved: JSON.stringify(allPlayersArray), // Store as JSON
          uploadStatus: "completed",
        },
      });

      console.log(`✅ Log stored in LogsMain with ID: ${logId}`);
      publishProgress(logId, "saving to database completed", 100);
    } catch (error) {
      console.error("❌ Error saving log to PostgreSQL:", error);
      await prisma.logs.update({
        where: { logId },
        data: { uploadStatus: "failed", dbUploadCompleteAt: new Date() },
      });

      publishProgress(job.data.logId, "error", error.message);
    }
  },
  { connection: redisConnection }
);

console.log("🚀 Optimized PostgreSQL save worker started...");
export default postgresWorker;
