-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "clientId" TEXT,
    "clientName" TEXT,
    "clientRut" TEXT,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "workAddress" TEXT,
    "workPlace" TEXT,
    "workTitle" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "conditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Budget_folio_key" ON "Budget"("folio");
