ALTER TYPE "AuditAction" ADD VALUE 'READ';
ALTER TYPE "AuditAction" ADD VALUE 'AUTH_FAILURE';
ALTER TYPE "AuditAction" ADD VALUE 'ACCESS_DENIED';
ALTER TYPE "AuditAction" ADD VALUE 'FAILED';

ALTER TABLE "audit_logs"
  ADD COLUMN "actorName" VARCHAR(255),
  ADD COLUMN "roles" JSONB,
  ADD COLUMN "outcome" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  ADD COLUMN "route" VARCHAR(500),
  ADD COLUMN "method" VARCHAR(10),
  ADD COLUMN "summary" VARCHAR(500),
  ADD COLUMN "previousHash" VARCHAR(64),
  ADD COLUMN "eventHash" VARCHAR(64);

ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_organizationId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actorId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_branchId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_roleId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "audit_logs_outcome_idx" ON "audit_logs"("outcome");
CREATE INDEX "audit_logs_event_hash_idx" ON "audit_logs"("eventHash");

CREATE FUNCTION prevent_audit_log_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Audit log records are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_prevent_update_delete
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER audit_logs_prevent_truncate
  BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_log_mutation();

INSERT INTO "permissions" ("id", "name", "module", "description", "createdAt")
VALUES (gen_random_uuid(), 'audit:read', 'AUDIT', 'View organization audit trail', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" IN ('OWNER', 'ADMIN') AND p."name" = 'audit:read'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;