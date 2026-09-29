-- CreateTable
CREATE TABLE "ExerciseEditor" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseEditor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseEditor_userId_idx" ON "ExerciseEditor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseEditor_exerciseId_userId_key" ON "ExerciseEditor"("exerciseId", "userId");

-- AddForeignKey
ALTER TABLE "ExerciseEditor" ADD CONSTRAINT "ExerciseEditor_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseEditor" ADD CONSTRAINT "ExerciseEditor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseEditor" ADD CONSTRAINT "ExerciseEditor_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
