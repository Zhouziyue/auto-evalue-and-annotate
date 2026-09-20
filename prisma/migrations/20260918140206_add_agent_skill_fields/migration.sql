-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agent_endpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "model" TEXT,
    "systemPrompt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "authType" TEXT NOT NULL DEFAULT 'none',
    "authConfig" TEXT,
    "sseFormat" TEXT NOT NULL DEFAULT 'auto',
    "sseTemplate" TEXT,
    "requestTemplate" TEXT,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agent_endpoints_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_agent_endpoints" ("authConfig", "authType", "createdAt", "id", "maxRetries", "name", "requestTemplate", "skillId", "sseFormat", "sseTemplate", "timeout", "updatedAt", "url") SELECT "authConfig", "authType", "createdAt", "id", "maxRetries", "name", "requestTemplate", "skillId", "sseFormat", "sseTemplate", "timeout", "updatedAt", "url" FROM "agent_endpoints";
DROP TABLE "agent_endpoints";
ALTER TABLE "new_agent_endpoints" RENAME TO "agent_endpoints";
CREATE TABLE "new_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "category" TEXT,
    "tags" TEXT,
    "instructions" TEXT,
    "allowedTools" TEXT,
    "requiredContext" TEXT,
    "author" TEXT,
    "license" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_skills" ("category", "createdAt", "description", "id", "name", "tags", "updatedAt", "version") SELECT "category", "createdAt", "description", "id", "name", "tags", "updatedAt", "version" FROM "skills";
DROP TABLE "skills";
ALTER TABLE "new_skills" RENAME TO "skills";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
