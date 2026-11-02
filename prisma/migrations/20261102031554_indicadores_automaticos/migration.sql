-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PayrollParams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "uf" REAL NOT NULL,
    "utm" INTEGER NOT NULL,
    "minWage" INTEGER NOT NULL,
    "topeAfpUf" REAL NOT NULL,
    "topeAfcUf" REAL NOT NULL,
    "afpRatesJson" TEXT NOT NULL,
    "sisRate" REAL NOT NULL,
    "mutualRate" REAL NOT NULL,
    "employerPensionRate" REAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "ufProvisional" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PayrollParams" ("afpRatesJson", "createdAt", "employerPensionRate", "id", "minWage", "mutualRate", "period", "sisRate", "topeAfcUf", "topeAfpUf", "uf", "updatedAt", "utm") SELECT "afpRatesJson", "createdAt", "employerPensionRate", "id", "minWage", "mutualRate", "period", "sisRate", "topeAfcUf", "topeAfpUf", "uf", "updatedAt", "utm" FROM "PayrollParams";
DROP TABLE "PayrollParams";
ALTER TABLE "new_PayrollParams" RENAME TO "PayrollParams";
CREATE UNIQUE INDEX "PayrollParams_period_key" ON "PayrollParams"("period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
