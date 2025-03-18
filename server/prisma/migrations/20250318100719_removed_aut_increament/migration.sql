-- AlterTable
ALTER TABLE "Attempt" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Attempt_id_seq";

-- AlterTable
ALTER TABLE "Boss" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Boss_id_seq";

-- AlterTable
ALTER TABLE "Encounter" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Encounter_id_seq";

-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Player_id_seq";
