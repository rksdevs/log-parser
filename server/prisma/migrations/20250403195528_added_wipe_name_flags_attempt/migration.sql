-- CreateEnum
CREATE TYPE "AttemptType" AS ENUM ('kill', 'wipe');

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "name" TEXT,
ADD COLUMN     "type" "AttemptType";
