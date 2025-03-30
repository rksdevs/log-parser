import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetLogs() {
  try {
    console.log("🔹 Resetting all tables...");

    // 1️⃣ Delete most dependent child records first
    await prisma.spellStatistic.deleteMany({});
    await prisma.log.deleteMany({});
    await prisma.attemptParticipant.deleteMany({});
    await prisma.allActor.deleteMany({});
    await prisma.attempt.deleteMany({});
    await prisma.boss.deleteMany({});
    await prisma.encounter.deleteMany({});

    // 2️⃣ Delete pet records (if any)
    await prisma.pet.deleteMany({});

    // 3️⃣ Delete main log tracking tables
    await prisma.logsMain.deleteMany({});
    await prisma.logs.deleteMany({});

    // 4️⃣ Finally, delete player table (should be safe now)
    await prisma.player.deleteMany({});

    console.log("✅ All tables reset.");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetLogs();
