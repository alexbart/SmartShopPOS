-- AlterTable: add idempotencyKey to payments (nullable for backward compatibility)
ALTER TABLE "payments" ADD COLUMN "idempotencyKey" VARCHAR(255);

-- CreateIndex: unique constraint so duplicate keys are rejected at DB level
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");
