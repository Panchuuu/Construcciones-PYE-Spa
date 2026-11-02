-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rut" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" DATETIME,
    "nationality" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "position" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "contractEndDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'activo',
    "terminationDate" DATETIME,
    "baseSalary" INTEGER NOT NULL DEFAULT 0,
    "dailyRate" INTEGER NOT NULL DEFAULT 0,
    "weeklyHours" INTEGER NOT NULL DEFAULT 42,
    "gratification" BOOLEAN NOT NULL DEFAULT true,
    "afp" TEXT,
    "healthSystem" TEXT NOT NULL DEFAULT 'fonasa',
    "isapreName" TEXT,
    "isapreUf" REAL,
    "mealAllowance" INTEGER NOT NULL DEFAULT 0,
    "transportAllowance" INTEGER NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "accountType" TEXT,
    "accountNumber" TEXT,
    "workId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollParams" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "workId" TEXT,
    "inputJson" TEXT NOT NULL,
    "resultJson" TEXT NOT NULL,
    "netPay" INTEGER NOT NULL,
    "companyCost" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payslip_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "endDate" DATETIME NOT NULL,
    "cause" TEXT NOT NULL,
    "inputJson" TEXT NOT NULL,
    "resultJson" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settlement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DayPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workId" TEXT,
    "date" DATETIME NOT NULL,
    "periodText" TEXT,
    "days" REAL NOT NULL,
    "dailyRate" INTEGER NOT NULL,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "discounts" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DayPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DayPayment_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workId" TEXT,
    "docType" TEXT,
    "docNumber" TEXT,
    "counterparty" TEXT,
    "counterpartyRut" TEXT,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "attachmentData" BLOB,
    "attachmentMime" TEXT,
    "attachmentName" TEXT,
    "payslipId" TEXT,
    "settlementId" TEXT,
    "dayPaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Movement_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Movement_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Movement_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Movement_dayPaymentId_fkey" FOREIGN KEY ("dayPaymentId") REFERENCES "DayPayment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_rut_key" ON "Employee"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollParams_period_key" ON "PayrollParams"("period");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_folio_key" ON "Payslip"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_employeeId_period_key" ON "Payslip"("employeeId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_folio_key" ON "Settlement"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "DayPayment_folio_key" ON "DayPayment"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_payslipId_key" ON "Movement"("payslipId");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_settlementId_key" ON "Movement"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_dayPaymentId_key" ON "Movement"("dayPaymentId");

-- CreateIndex
CREATE INDEX "Movement_date_idx" ON "Movement"("date");
