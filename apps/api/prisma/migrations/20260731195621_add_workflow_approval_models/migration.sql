-- CreateEnum
CREATE TYPE "WorkflowAction" AS ENUM ('PURCHASE_ORDER', 'EXPENSE', 'SALE_VOID', 'SALE_DISCOUNT', 'STOCK_ADJUSTMENT', 'PRICE_CHANGE', 'CASH_DRAWER_CORRECTION');

-- CreateEnum
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "approval_rules" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "action" "WorkflowAction" NOT NULL,
    "minimumAmount" DECIMAL(12,2),
    "maximumAmount" DECIMAL(12,2),
    "approverRoleId" UUID NOT NULL,
    "branchId" UUID,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "action" "WorkflowAction" NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "amount" DECIMAL(12,2),
    "branchId" UUID,
    "ruleId" UUID,
    "requestedBy" UUID NOT NULL,
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP,
    "comments" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_rules_organizationId_action_priority_idx" ON "approval_rules"("organizationId", "action", "priority");

-- CreateIndex
CREATE INDEX "approval_rules_organizationId_action_isActive_idx" ON "approval_rules"("organizationId", "action", "isActive");

-- CreateIndex
CREATE INDEX "approval_rules_approverRoleId_idx" ON "approval_rules"("approverRoleId");

-- CreateIndex
CREATE INDEX "approval_requests_organizationId_status_idx" ON "approval_requests"("organizationId", "status");

-- CreateIndex
CREATE INDEX "approval_requests_organizationId_action_idx" ON "approval_requests"("organizationId", "action");

-- CreateIndex
CREATE INDEX "approval_requests_organizationId_entityType_entityId_idx" ON "approval_requests"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "approval_requests_ruleId_idx" ON "approval_requests"("ruleId");

-- CreateIndex
CREATE INDEX "approval_requests_requestedBy_idx" ON "approval_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "approval_requests_approvedBy_idx" ON "approval_requests"("approvedBy");

-- CreateIndex
CREATE INDEX "approval_requests_action_status_idx" ON "approval_requests"("action", "status");

-- AddForeignKey
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "approval_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
