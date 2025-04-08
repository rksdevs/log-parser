-- AlterTable
ALTER TABLE "AllActor" ADD COLUMN     "actorDamage" INTEGER,
ADD COLUMN     "actorTotalDamage" INTEGER,
ADD COLUMN     "class" TEXT,
ADD COLUMN     "healing" INTEGER,
ADD COLUMN     "pets" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "spellList" JSONB,
ALTER COLUMN "data" DROP NOT NULL;
