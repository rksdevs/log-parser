import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetLogs() {
  try {
    console.log("🚀 Resetting Logs table...");

    // Delete all log entries
    await prisma.logs.deleteMany();

    // Reset logId sequence
    await prisma.$executeRaw`ALTER SEQUENCE "Logs_logId_seq" RESTART WITH 1;`;

    console.log("✅ Logs table reset successfully!");
  } catch (error) {
    console.error("❌ Error resetting logs table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetLogs();
