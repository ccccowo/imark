/*
  Warnings:

  - A unique constraint covering the columns `[studentId]` on the table `Examinee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_IN_THE_BLANK', 'TRUE_OR_FALSE', 'SHORT_ANSWER');

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "fullScore" DOUBLE PRECISION,
ADD COLUMN     "paperImage" TEXT;

-- AlterTable
ALTER TABLE "Examinee" ADD COLUMN     "totalScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "AnswerQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "examineeId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerQuestionImage" TEXT NOT NULL,
    "fullScore" DOUBLE PRECISION,
    "teacherScore" DOUBLE PRECISION,
    "aiScore" DOUBLE PRECISION,
    "teacherComment" TEXT,
    "aiComment" TEXT,
    "isGraded" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "type" "QuestionType" NOT NULL,
    "orderNum" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnswerQuestion_examineeId_questionId_key" ON "AnswerQuestion"("examineeId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Examinee_studentId_key" ON "Examinee"("studentId");

-- AddForeignKey
ALTER TABLE "AnswerQuestion" ADD CONSTRAINT "AnswerQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerQuestion" ADD CONSTRAINT "AnswerQuestion_examineeId_fkey" FOREIGN KEY ("examineeId") REFERENCES "Examinee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerQuestion" ADD CONSTRAINT "AnswerQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
