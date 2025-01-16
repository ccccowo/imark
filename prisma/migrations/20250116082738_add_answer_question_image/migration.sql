/*
  Warnings:

  - You are about to drop the column `paperImages` on the `AnswerQuestion` table. All the data in the column will be lost.
  - Added the required column `answerQuestionImage` to the `AnswerQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnswerQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "examineeId" TEXT NOT NULL,
    "answerQuestionImage" TEXT NOT NULL,
    "fullScore" REAL,
    "teacherScore" REAL,
    "aiScore" REAL,
    "teacherComment" TEXT,
    "aiComment" TEXT,
    "isGraded" BOOLEAN DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AnswerQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnswerQuestion_examineeId_fkey" FOREIGN KEY ("examineeId") REFERENCES "Examinee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnswerQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AnswerQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AnswerQuestion" ("aiComment", "aiScore", "createdAt", "examId", "examineeId", "fullScore", "id", "isGraded", "questionId", "teacherComment", "teacherScore", "updatedAt", "userId") SELECT "aiComment", "aiScore", "createdAt", "examId", "examineeId", "fullScore", "id", "isGraded", "questionId", "teacherComment", "teacherScore", "updatedAt", "userId" FROM "AnswerQuestion";
DROP TABLE "AnswerQuestion";
ALTER TABLE "new_AnswerQuestion" RENAME TO "AnswerQuestion";
CREATE UNIQUE INDEX "AnswerQuestion_examineeId_questionId_key" ON "AnswerQuestion"("examineeId", "questionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
