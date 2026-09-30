-- CreateTable
CREATE TABLE "annotation_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'eval_review',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "evalRunId" TEXT,
    "createdBy" TEXT,
    "assignees" TEXT,
    "config" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "annotation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "context" TEXT,
    "preAnnotation" TEXT,
    "annotation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "annotation_items_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "annotation_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables (annotations: 增加 taskId/status/confidence/modelVersion/reviewedBy/reviewedAt)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_annotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evalResultId" TEXT NOT NULL,
    "taskId" TEXT,
    "type" TEXT NOT NULL,
    "annotatorId" TEXT,
    "scores" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confidence" REAL,
    "modelVersion" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "annotations_evalResultId_fkey" FOREIGN KEY ("evalResultId") REFERENCES "eval_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "annotations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "annotation_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_annotations" ("annotatorId", "comment", "createdAt", "evalResultId", "id", "isFinal", "scores", "type", "updatedAt") SELECT "annotatorId", "comment", "createdAt", "evalResultId", "id", "isFinal", "scores", "type", "updatedAt" FROM "annotations";
DROP TABLE "annotations";
ALTER TABLE "new_annotations" RENAME TO "annotations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
