ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "chainSequence" BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS "audit_logs_org_chain_sequence_key" ON "audit_logs"("organizationId", "chainSequence");