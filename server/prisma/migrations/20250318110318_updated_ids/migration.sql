/*
  Warnings:

  - The primary key for the `Attempt` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Encounter` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "AttemptParticipant" DROP CONSTRAINT "AttemptParticipant_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "Boss" DROP CONSTRAINT "Boss_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "SpellStatistic" DROP CONSTRAINT "SpellStatistic_attemptId_fkey";

-- AlterTable
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "AttemptParticipant" ALTER COLUMN "attemptId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Boss" ALTER COLUMN "encounterId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Encounter" DROP CONSTRAINT "Encounter_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Log" ALTER COLUMN "attemptId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SpellStatistic" ALTER COLUMN "attemptId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Boss" ADD CONSTRAINT "Boss_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptParticipant" ADD CONSTRAINT "AttemptParticipant_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellStatistic" ADD CONSTRAINT "SpellStatistic_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
