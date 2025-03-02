import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.logs.createMany({
    data: [
      {
        fileName: "raid_log_123.txt",
        s3FilePath:
          "https://your-bucket.s3.amazonaws.com/logs/raid_log_123.txt",
        serverName: "Warmane - Icecrown",
        fileSize: 2048576,
        fileType: "text/plain",
        uploadStatus: "completed",
        processingStatus: "pending",
      },
      {
        fileName: "boss_fight_456.log",
        s3FilePath:
          "https://your-bucket.s3.amazonaws.com/logs/boss_fight_456.log",
        serverName: "Atlantiss - Karazhan",
        fileSize: 3097152,
        fileType: "text/plain",
        uploadStatus: "completed",
        processingStatus: "completed",
      },
      {
        fileName: "pvp_arena_789.log",
        s3FilePath:
          "https://your-bucket.s3.amazonaws.com/logs/pvp_arena_789.log",
        serverName: "Lordaeron - Arena",
        fileSize: 1502345,
        fileType: "text/plain",
        uploadStatus: "failed",
        processingStatus: "failed",
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
