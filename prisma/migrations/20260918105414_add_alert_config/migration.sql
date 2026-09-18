-- CreateTable
CREATE TABLE "alert_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL DEFAULT 'wechat',
    "webhookKey" TEXT NOT NULL,
    "passRateThreshold" REAL NOT NULL DEFAULT 80.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
