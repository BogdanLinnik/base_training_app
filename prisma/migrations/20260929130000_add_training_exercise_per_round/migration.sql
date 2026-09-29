-- AlterTable
ALTER TABLE "TrainingExercise" ADD COLUMN     "perRound" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TrainingExerciseRoundValue" (
    "id" TEXT NOT NULL,
    "trainingExerciseId" TEXT NOT NULL,
    "roundIndex" INTEGER NOT NULL,
    "childExerciseId" TEXT,
    "plannedWeight" DOUBLE PRECISION,
    "plannedTime" INTEGER,
    "plannedReps" INTEGER,

    CONSTRAINT "TrainingExerciseRoundValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingExerciseRoundValue_trainingExerciseId_idx" ON "TrainingExerciseRoundValue"("trainingExerciseId");

-- AddForeignKey
ALTER TABLE "TrainingExerciseRoundValue" ADD CONSTRAINT "TrainingExerciseRoundValue_trainingExerciseId_fkey" FOREIGN KEY ("trainingExerciseId") REFERENCES "TrainingExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseRoundValue" ADD CONSTRAINT "TrainingExerciseRoundValue_childExerciseId_fkey" FOREIGN KEY ("childExerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
