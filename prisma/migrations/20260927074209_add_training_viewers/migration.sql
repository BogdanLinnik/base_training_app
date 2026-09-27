-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TRAINING_VIEWER_ADDED';

-- AlterTable
ALTER TABLE "NotificationSettings" ADD COLUMN     "emailOnAddedAsViewer" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "TrainingViewer" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingViewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingViewer_userId_idx" ON "TrainingViewer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingViewer_trainingId_userId_key" ON "TrainingViewer"("trainingId", "userId");

-- AddForeignKey
ALTER TABLE "TrainingViewer" ADD CONSTRAINT "TrainingViewer_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingViewer" ADD CONSTRAINT "TrainingViewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingViewer" ADD CONSTRAINT "TrainingViewer_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
