/*
  Warnings:

  - A unique constraint covering the columns `[guid,name]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Player_guid_name_key" ON "Player"("guid", "name");
