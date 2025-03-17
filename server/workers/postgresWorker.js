import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      let playerInserts = [];
      let attemptParticipantInserts = [];
      let logInserts = [];

      // Batch Fetch Existing Players to Avoid Repeated Lookups
      let existingPlayers = await prisma.player.findMany({
        select: { id: true, name: true },
      });
      let playerMap = new Map(existingPlayers.map((p) => [p.name, p.id]));

      for (const encounterName in structuredFights) {
        const bosses = structuredFights[encounterName];

        // Prepare encounter insert
        const encounterId = encounterInserts.length + 1;
        encounterInserts.push({ id: encounterId, name: encounterName, logId });

        for (const bossName in bosses) {
          const attempts = bosses[bossName];

          // Prepare boss insert
          const bossId = bossInserts.length + 1;
          bossInserts.push({ id: bossId, name: bossName, encounterId });

          for (const attempt of attempts) {
            const attemptId = attemptInserts.length + 1;
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
                playerId = playerInserts.length + 1;
                playerInserts.push({
                  id: playerId,
                  name: playerName,
                  class: attempt.players[playerName].class,
                });
                playerMap.set(playerName, playerId);
              }

              attemptParticipantInserts.push({
                attemptId,
                playerId,
                damageDone: attempt.damageByPlayer[playerName] || 0,
                healingDone: attempt.players[playerName].healing || 0,
              });
            }

            for (const logEvent of attempt.logs) {
              logInserts.push({
                attemptId,
                timestamp: new Date(logEvent.timestamp),
                sourceGUID: logEvent.sourceGUID,
                targetGUID: logEvent.targetGUID,
                spellId: logEvent.spellId ? parseInt(logEvent.spellId) : null,
                spellName: logEvent.spellName,
                eventType: logEvent.eventType,
              });
            }
          }
        }
      }

      // Bulk Insert Data into Database
      console.log(`📌 Inserting ${encounterInserts.length} encounters...`);
      await prisma.encounter.createMany({ data: encounterInserts });

      console.log(`📌 Inserting ${bossInserts.length} bosses...`);
      await prisma.boss.createMany({ data: bossInserts });

      console.log(`📌 Inserting ${attemptInserts.length} attempts...`);
      await prisma.attempt.createMany({ data: attemptInserts });

      console.log(`📌 Inserting ${playerInserts.length} players...`);
      await prisma.player.createMany({ data: playerInserts });

      console.log(
        `📌 Inserting ${attemptParticipantInserts.length} attempt participants...`
      );
      await prisma.attemptParticipant.createMany({
        data: attemptParticipantInserts,
      });

      console.log(`📌 Inserting ${logInserts.length} logs...`);
      await prisma.log.createMany({ data: logInserts });

      // ✅ Update `uploadStatus` after successful insert
      await prisma.logs.update({
        where: { logId },
        data: {
          uploadStatus: "completed",
          dbUploadCompleteAt: new Date(Date.now()),
        },
      });

      console.log(`✅ PostgreSQL save completed for log ID: ${logId}`);
    } catch (error) {
      console.error("❌ Error saving log to PostgreSQL:", error);
      await prisma.logs.update({
        where: { logId },
        data: {
          uploadStatus: "failed",
          dbUploadCompleteAt: new Date(Date.now()),
        },
      });
    }
  },
  { connection: redisConnection }
);

console.log("🚀 Optimized PostgreSQL save worker started...");
export default postgresWorker;
