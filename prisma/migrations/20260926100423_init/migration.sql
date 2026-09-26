-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('SIMPLE', 'COMPLEX');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('WEIGHT', 'TIME', 'REPS');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('CREATED', 'PENDING_REVIEW', 'ACCEPTED', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT,
    "youtubeUrl" TEXT,
    "attributeTypes" "AttributeType"[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplexExerciseItem" (
    "id" TEXT NOT NULL,
    "parentExerciseId" TEXT NOT NULL,
    "childExerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ComplexExerciseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "forUserId" TEXT NOT NULL,
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "TrainingStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingExercise" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "roundsCount" INTEGER NOT NULL DEFAULT 1,
    "plannedWeight" DOUBLE PRECISION,
    "plannedTime" INTEGER,
    "plannedReps" INTEGER,

    CONSTRAINT "TrainingExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingExerciseChildValue" (
    "id" TEXT NOT NULL,
    "trainingExerciseId" TEXT NOT NULL,
    "childExerciseId" TEXT NOT NULL,
    "plannedWeight" DOUBLE PRECISION,
    "plannedTime" INTEGER,
    "plannedReps" INTEGER,

    CONSTRAINT "TrainingExerciseChildValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingExerciseResult" (
    "id" TEXT NOT NULL,
    "trainingExerciseId" TEXT NOT NULL,
    "roundIndex" INTEGER NOT NULL,
    "childExerciseId" TEXT,
    "actualWeight" DOUBLE PRECISION,
    "actualTime" INTEGER,
    "actualReps" INTEGER,

    CONSTRAINT "TrainingExerciseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "ComplexExerciseItem_parentExerciseId_idx" ON "ComplexExerciseItem"("parentExerciseId");

-- CreateIndex
CREATE INDEX "Training_createdById_idx" ON "Training"("createdById");

-- CreateIndex
CREATE INDEX "Training_forUserId_idx" ON "Training"("forUserId");

-- CreateIndex
CREATE INDEX "TrainingExercise_trainingId_idx" ON "TrainingExercise"("trainingId");

-- CreateIndex
CREATE INDEX "TrainingExerciseChildValue_trainingExerciseId_idx" ON "TrainingExerciseChildValue"("trainingExerciseId");

-- CreateIndex
CREATE INDEX "TrainingExerciseResult_trainingExerciseId_idx" ON "TrainingExerciseResult"("trainingExerciseId");

-- CreateIndex
CREATE INDEX "Comment_trainingId_idx" ON "Comment"("trainingId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplexExerciseItem" ADD CONSTRAINT "ComplexExerciseItem_parentExerciseId_fkey" FOREIGN KEY ("parentExerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplexExerciseItem" ADD CONSTRAINT "ComplexExerciseItem_childExerciseId_fkey" FOREIGN KEY ("childExerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExercise" ADD CONSTRAINT "TrainingExercise_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExercise" ADD CONSTRAINT "TrainingExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseChildValue" ADD CONSTRAINT "TrainingExerciseChildValue_trainingExerciseId_fkey" FOREIGN KEY ("trainingExerciseId") REFERENCES "TrainingExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseChildValue" ADD CONSTRAINT "TrainingExerciseChildValue_childExerciseId_fkey" FOREIGN KEY ("childExerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseResult" ADD CONSTRAINT "TrainingExerciseResult_trainingExerciseId_fkey" FOREIGN KEY ("trainingExerciseId") REFERENCES "TrainingExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingExerciseResult" ADD CONSTRAINT "TrainingExerciseResult_childExerciseId_fkey" FOREIGN KEY ("childExerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
