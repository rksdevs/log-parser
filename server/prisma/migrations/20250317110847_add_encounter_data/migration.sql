-- CreateTable
CREATE TABLE "Encounter" (
    "id" SERIAL NOT NULL,
    "logId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boss" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "encounterId" INTEGER NOT NULL,

    CONSTRAINT "Boss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" SERIAL NOT NULL,
    "bossId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "totalDamage" INTEGER NOT NULL,
    "totalHealing" INTEGER NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "class" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptParticipant" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "damageDone" INTEGER NOT NULL DEFAULT 0,
    "healingDone" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttemptParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourceGUID" TEXT,
    "targetGUID" TEXT,
    "spellId" INTEGER,
    "spellName" TEXT,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpellStatistic" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "spellId" INTEGER NOT NULL,
    "spellName" TEXT NOT NULL,
    "totalDamage" INTEGER NOT NULL DEFAULT 0,
    "totalCasts" INTEGER NOT NULL DEFAULT 0,
    "normalHits" INTEGER NOT NULL DEFAULT 0,
    "criticalHits" INTEGER NOT NULL DEFAULT 0,
    "periodicHits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SpellStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Logs"("logId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boss" ADD CONSTRAINT "Boss_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "Boss"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptParticipant" ADD CONSTRAINT "AttemptParticipant_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptParticipant" ADD CONSTRAINT "AttemptParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellStatistic" ADD CONSTRAINT "SpellStatistic_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellStatistic" ADD CONSTRAINT "SpellStatistic_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
