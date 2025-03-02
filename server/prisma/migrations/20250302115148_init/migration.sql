-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "Logs" (
    "logId" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "s3FilePath" TEXT NOT NULL,
    "serverName" TEXT NOT NULL,
    "uploadTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadStatus" "UploadStatus" NOT NULL,
    "processingStatus" "ProcessingStatus" NOT NULL,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("logId")
);
