-- DropForeignKey
ALTER TABLE "Encounter" DROP CONSTRAINT "Encounter_logId_fkey";

-- DropIndex
DROP INDEX "unique_encounter_per_log";

-- DropIndex
DROP INDEX "Player_name_key";

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Logs"("logId") ON DELETE RESTRICT ON UPDATE CASCADE;
