-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('OPENING_FLOAT', 'SALE', 'REFUND', 'CASH_IN', 'CASH_OUT', 'CLOSING');

-- CreateEnum
CREATE TYPE "CashDrawerSessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'UTILITIES', 'SALARIES', 'SUPPLIES', 'TRANSPORT', 'MARKETING', 'INSURANCE', 'TAXES', 'OTHER');

-- CreateTable
CREATE TABLE "cash_drawers" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "cash_drawers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_drawer_sessions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "cashDrawerId" UUID NOT NULL,
    "openedBy" UUID NOT NULL,
    "status" "CashDrawerSessionStatus" NOT NULL DEFAULT 'OPEN',
    "openingFloat" DECIMAL(12,2) NOT NULL,
    "closingFloat" DECIMAL(12,2),
    "totalSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalRefunds" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCashIn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCashOut" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expectedCash" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "countedCash" DECIMAL(12,2),
    "variance" DECIMAL(12,2),
    "openedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP,

    CONSTRAINT "cash_drawer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "referenceType" VARCHAR(50),
    "referenceId" UUID,
    "notes" TEXT,
    "performedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "expenseDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidById" UUID,
    "paymentReference" VARCHAR(100),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "budget" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_drawers_organizationId_idx" ON "cash_drawers"("organizationId");

-- CreateIndex
CREATE INDEX "cash_drawer_sessions_organizationId_idx" ON "cash_drawer_sessions"("organizationId");

-- CreateIndex
CREATE INDEX "cash_drawer_sessions_cashDrawerId_idx" ON "cash_drawer_sessions"("cashDrawerId");

-- CreateIndex
CREATE INDEX "cash_drawer_sessions_status_idx" ON "cash_drawer_sessions"("status");

-- CreateIndex
CREATE INDEX "cash_movements_organizationId_idx" ON "cash_movements"("organizationId");

-- CreateIndex
CREATE INDEX "cash_movements_sessionId_idx" ON "cash_movements"("sessionId");

-- CreateIndex
CREATE INDEX "cash_movements_type_idx" ON "cash_movements"("type");

-- CreateIndex
CREATE INDEX "cash_movements_createdAt_idx" ON "cash_movements"("createdAt");

-- CreateIndex
CREATE INDEX "expenses_organizationId_idx" ON "expenses"("organizationId");

-- CreateIndex
CREATE INDEX "expenses_categoryId_idx" ON "expenses"("categoryId");

-- CreateIndex
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "expense_categories_organizationId_idx" ON "expense_categories"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_organizationId_code_key" ON "expense_categories"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "cash_drawers" ADD CONSTRAINT "cash_drawers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_drawer_sessions" ADD CONSTRAINT "cash_drawer_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_drawer_sessions" ADD CONSTRAINT "cash_drawer_sessions_cashDrawerId_fkey" FOREIGN KEY ("cashDrawerId") REFERENCES "cash_drawers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cash_drawer_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
