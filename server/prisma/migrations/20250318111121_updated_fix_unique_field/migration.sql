/*
  Warnings:

  - A unique constraint covering the columns `[logId]` on the table `Encounter` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "encounter_unique_per_log";

-- DropIndex
DROP INDEX "unique_encounter_per_log";

-- CreateIndex
CREATE UNIQUE INDEX "unique_encounter_per_log" ON "Encounter"("logId");
