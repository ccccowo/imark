-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Class" ("createdAt", "id", "name", "subject", "teacherId", "updatedAt") SELECT "createdAt", "id", "name", "subject", "teacherId", "updatedAt" FROM "Class";
DROP TABLE "Class";
ALTER TABLE "new_Class" RENAME TO "Class";
CREATE INDEX "Class_teacherId_idx" ON "Class"("teacherId");
CREATE UNIQUE INDEX "Class_name_teacherId_key" ON "Class"("name", "teacherId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
