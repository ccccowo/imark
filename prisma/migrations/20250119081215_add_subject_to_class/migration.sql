/*
  Warnings:

  - Added the required column `subject` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "Class_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '未设置',
    "teacherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "Class_new" ("id", "name", "teacherId", "createdAt", "updatedAt", "subject")
SELECT "id", "name", "teacherId", "createdAt", "updatedAt", '未设置'
FROM "Class";
DROP TABLE "Class";
ALTER TABLE "Class_new" RENAME TO "Class";
CREATE INDEX "Class_teacherId_idx" ON "Class"("teacherId");
CREATE UNIQUE INDEX "Class_name_teacherId_key" ON "Class"("name", "teacherId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
