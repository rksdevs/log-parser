import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetLogs() {
  try {
    console.log("🔹 Resetting dependent tables...");

    // 1️⃣ Delete all dependent records first
    await prisma.spellStatistic.deleteMany({});
    await prisma.log.deleteMany({});
    await prisma.attemptParticipant.deleteMany({});
    await prisma.attempt.deleteMany({});
    await prisma.boss.deleteMany({});
    await prisma.encounter.deleteMany({});
    await prisma.player.deleteMany({});

    console.log("✅ Dependent tables reset.");

    // 2️⃣ Now, safely delete logs
    console.log("🔹 Resetting Logs table...");
    await prisma.logs.deleteMany({});
    console.log("✅ Logs table reset.");
  } catch (error) {
    console.error(" Error resetting logs table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetLogs();
