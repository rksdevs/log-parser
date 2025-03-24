-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "logId" INTEGER NOT NULL,
    "petGUID" TEXT NOT NULL,
    "petName" TEXT NOT NULL,
    "ownerGUID" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "logsLogId" INTEGER,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pet_logId_idx" ON "Pet"("logId");

-- CreateIndex
CREATE INDEX "Pet_petGUID_idx" ON "Pet"("petGUID");

-- CreateIndex
CREATE INDEX "Pet_ownerGUID_idx" ON "Pet"("ownerGUID");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_logId_fkey" FOREIGN KEY ("logId") REFERENCES "LogsMain"("logId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_logsLogId_fkey" FOREIGN KEY ("logsLogId") REFERENCES "Logs"("logId") ON DELETE SET NULL ON UPDATE CASCADE;
