-- CreateTable
CREATE TABLE "LogsMain" (
    "id" SERIAL NOT NULL,
    "logId" INTEGER NOT NULL,
    "firstEncounter" TIMESTAMP(3) NOT NULL,
    "playersInvolved" TEXT NOT NULL,
    "uploadStatus" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogsMain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LogsMain_logId_key" ON "LogsMain"("logId");

-- AddForeignKey
ALTER TABLE "LogsMain" ADD CONSTRAINT "LogsMain_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Logs"("logId") ON DELETE CASCADE ON UPDATE CASCADE;
