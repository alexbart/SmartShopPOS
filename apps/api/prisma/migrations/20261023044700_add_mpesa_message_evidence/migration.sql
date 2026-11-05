-- CreateEnum
CREATE TYPE "MpesaEvidenceStatus" AS ENUM ('CAPTURED', 'REVIEWED', 'REJECTED');

-- CreateTable
CREATE TABLE "mpesa_message_evidence" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "capturedBy" UUID NOT NULL,
    "rawMessage" TEXT NOT NULL,
    "claimedReceiptCode" VARCHAR(50),
    "claimedAmount" DECIMAL(12,2),
    "claimedPhone" VARCHAR(30),
    "claimedPaidAt" TIMESTAMP(6),
    "status" "MpesaEvidenceStatus" NOT NULL DEFAULT 'CAPTURED',
    "reviewNotes" VARCHAR(1000),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(6),
    "reviewedBy" UUID,

    CONSTRAINT "mpesa_message_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mpesa_message_evidence_organizationId_createdAt_idx" ON "mpesa_message_evidence"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "mpesa_message_evidence_organizationId_paymentId_idx" ON "mpesa_message_evidence"("organizationId", "paymentId");

-- CreateIndex
CREATE INDEX "mpesa_message_evidence_claimedReceiptCode_idx" ON "mpesa_message_evidence"("claimedReceiptCode");

-- CreateIndex
CREATE INDEX "mpesa_message_evidence_status_idx" ON "mpesa_message_evidence"("status");

-- AddForeignKey
ALTER TABLE "mpesa_message_evidence" ADD CONSTRAINT "mpesa_message_evidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mpesa_message_evidence" ADD CONSTRAINT "mpesa_message_evidence_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mpesa_message_evidence" ADD CONSTRAINT "mpesa_message_evidence_capturedBy_fkey" FOREIGN KEY ("capturedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mpesa_message_evidence" ADD CONSTRAINT "mpesa_message_evidence_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
