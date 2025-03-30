/*
  Warnings:

  - You are about to drop the column `actorDamage` on the `AllActor` table. All the data in the column will be lost.
  - You are about to drop the column `actorTotalDamage` on the `AllActor` table. All the data in the column will be lost.
  - You are about to drop the column `class` on the `AllActor` table. All the data in the column will be lost.
  - You are about to drop the column `healing` on the `AllActor` table. All the data in the column will be lost.
  - You are about to drop the column `pets` on the `AllActor` table. All the data in the column will be lost.
  - Added the required column `data` to the `AllActor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AllActor" DROP COLUMN "actorDamage",
DROP COLUMN "actorTotalDamage",
DROP COLUMN "class",
DROP COLUMN "healing",
DROP COLUMN "pets",
ADD COLUMN     "data" JSONB NOT NULL;
