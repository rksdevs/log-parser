/*
  Warnings:

  - Added the required column `icon` to the `SpellStatistic` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpellStatistic" ADD COLUMN     "icon" TEXT NOT NULL;
