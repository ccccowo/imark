-- AlterTable
ALTER TABLE "AnswerQuestion" ADD COLUMN "aiAnswer" TEXT;
ALTER TABLE "AnswerQuestion" ADD COLUMN "aiConfidence" REAL;
ALTER TABLE "AnswerQuestion" ADD COLUMN "aiStatus" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "correctAnswer" TEXT;
