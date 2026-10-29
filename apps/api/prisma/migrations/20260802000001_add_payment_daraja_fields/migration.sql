-- AlterTable: add Daraja provider identity fields to payments
ALTER TABLE "payments" ADD COLUMN "darajaRequestId" VARCHAR(255);
ALTER TABLE "payments" ADD COLUMN "darajaTransactionId" VARCHAR(255);

-- darajaRequestId is Safaricom's CheckoutRequestID — unique per STK push request
CREATE UNIQUE INDEX "payments_darajaRequestId_key" ON "payments"("darajaRequestId");
