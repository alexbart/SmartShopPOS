-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "bankName" VARCHAR(100) NOT NULL,
    "accountNumber" VARCHAR(50) NOT NULL,
    "accountType" "BankAccountType" NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transfers" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "fromAccountId" UUID NOT NULL,
    "toAccountId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "referenceType" VARCHAR(50),
    "referenceId" UUID,
    "notes" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "transferredAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP,

    CONSTRAINT "bank_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "fromCashDrawerSessionId" UUID NOT NULL,
    "toAccountId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "referenceNumber" VARCHAR(50) NOT NULL,
    "depositedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_accounts_organizationId_idx" ON "bank_accounts"("organizationId");

-- CreateIndex
CREATE INDEX "bank_accounts_isActive_idx" ON "bank_accounts"("isActive");

-- CreateIndex
CREATE INDEX "bank_transfers_organizationId_idx" ON "bank_transfers"("organizationId");

-- CreateIndex
CREATE INDEX "bank_transfers_fromAccountId_idx" ON "bank_transfers"("fromAccountId");

-- CreateIndex
CREATE INDEX "bank_transfers_toAccountId_idx" ON "bank_transfers"("toAccountId");

-- CreateIndex
CREATE INDEX "bank_transfers_status_idx" ON "bank_transfers"("status");

-- CreateIndex
CREATE INDEX "bank_transfers_transferredAt_idx" ON "bank_transfers"("transferredAt");

-- CreateIndex
CREATE INDEX "deposits_organizationId_idx" ON "deposits"("organizationId");

-- CreateIndex
CREATE INDEX "deposits_fromCashDrawerSessionId_idx" ON "deposits"("fromCashDrawerSessionId");

-- CreateIndex
CREATE INDEX "deposits_toAccountId_idx" ON "deposits"("toAccountId");

-- CreateIndex
CREATE INDEX "deposits_depositedAt_idx" ON "deposits"("depositedAt");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
