/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Encounter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[logId,name]` on the table `Encounter` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Encounter" DROP CONSTRAINT "Encounter_logId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "encounter_unique_per_log" ON "Encounter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_encounter_per_log" ON "Encounter"("logId", "name");

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Logs"("logId") ON DELETE CASCADE ON UPDATE CASCADE;
