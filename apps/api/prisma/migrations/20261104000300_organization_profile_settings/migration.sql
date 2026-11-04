ALTER TABLE "organizations"
  ADD COLUMN "tagline" TEXT,
  ADD COLUMN "businessType" VARCHAR(100),
  ADD COLUMN "vatNumber" VARCHAR(50),
  ADD COLUMN "website" VARCHAR(255),
  ADD COLUMN "receiptFooter" TEXT;

INSERT INTO "permissions" ("id", "name", "module", "description", "createdAt")
VALUES
  (gen_random_uuid(), 'organization:read', 'ORGANIZATION', 'View organization profile', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'organization:update', 'ORGANIZATION', 'Update organization profile', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" IN ('OWNER', 'ADMIN')
  AND p."name" IN ('organization:read', 'organization:update')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
