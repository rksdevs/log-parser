/*
  Warnings:

  - You are about to drop the column `totalDamage` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the column `totalHealing` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the column `logsLogId` on the `Pet` table. All the data in the column will be lost.
  - Added the required column `damageByActors` to the `Attempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `healingByActors` to the `Attempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overallDamage` to the `Attempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overallHealing` to the `Attempt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pet" DROP CONSTRAINT "Pet_logId_fkey";

-- DropForeignKey
ALTER TABLE "Pet" DROP CONSTRAINT "Pet_logsLogId_fkey";

-- AlterTable
ALTER TABLE "Attempt" DROP COLUMN "totalDamage",
DROP COLUMN "totalHealing",
ADD COLUMN     "damageByActors" JSONB NOT NULL,
ADD COLUMN     "healingByActors" JSONB NOT NULL,
ADD COLUMN     "overallDamage" INTEGER NOT NULL,
ADD COLUMN     "overallHealing" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Pet" DROP COLUMN "logsLogId";

-- CreateTable
CREATE TABLE "AllActor" (
    "id" SERIAL NOT NULL,
    "attemptId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "actorDamage" INTEGER NOT NULL,
    "actorTotalDamage" INTEGER NOT NULL,
    "healing" INTEGER NOT NULL,
    "pets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "spellList" JSONB NOT NULL,

    CONSTRAINT "AllActor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AllActor" ADD CONSTRAINT "AllActor_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Logs"("logId") ON DELETE CASCADE ON UPDATE CASCADE;
