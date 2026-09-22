-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_datasets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'draft',
    "validationReport" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_datasets" ("category", "createdAt", "description", "id", "name", "updatedAt") SELECT "category", "createdAt", "description", "id", "name", "updatedAt" FROM "datasets";
DROP TABLE "datasets";
ALTER TABLE "new_datasets" RENAME TO "datasets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
