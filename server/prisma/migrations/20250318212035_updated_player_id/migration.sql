-- AlterTable
CREATE SEQUENCE player_id_seq;
ALTER TABLE "Player" ALTER COLUMN "id" SET DEFAULT nextval('player_id_seq');
ALTER SEQUENCE player_id_seq OWNED BY "Player"."id";
