-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "endMs" BIGINT,
ADD COLUMN     "lineEnd" INTEGER,
ADD COLUMN     "lineStart" INTEGER,
ADD COLUMN     "startMs" BIGINT;
