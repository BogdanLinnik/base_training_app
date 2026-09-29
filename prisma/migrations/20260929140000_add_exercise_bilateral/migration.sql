-- CreateEnum
CREATE TYPE "ExerciseSide" AS ENUM ('LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "bilateral" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TrainingExerciseResult" ADD COLUMN     "side" "ExerciseSide";
