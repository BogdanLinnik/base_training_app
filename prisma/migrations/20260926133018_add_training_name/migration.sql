-- AlterTable: add as nullable first, backfill existing rows, then enforce NOT NULL
ALTER TABLE "Training" ADD COLUMN     "name" TEXT;

UPDATE "Training" SET "name" = 'Тренування ' || to_char("expectedDate", 'DD.MM.YYYY') WHERE "name" IS NULL;

ALTER TABLE "Training" ALTER COLUMN "name" SET NOT NULL;
