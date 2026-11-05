INSERT INTO "permissions" ("id", "name", "module", "description", "createdAt")
VALUES (gen_random_uuid(), 'health:read', 'SYSTEM', 'View service health diagnostics', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" IN ('OWNER', 'ADMIN') AND p."name" = 'health:read'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;