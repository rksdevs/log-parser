/*
  Warnings:

  - The primary key for the `Boss` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_bossId_fkey";

-- AlterTable
ALTER TABLE "Attempt" ALTER COLUMN "bossId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Boss" DROP CONSTRAINT "Boss_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Boss_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "Boss"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
