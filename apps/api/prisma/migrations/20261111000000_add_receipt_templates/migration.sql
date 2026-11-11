CREATE TABLE "receipt_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sections" JSONB NOT NULL,
    "styles" JSONB NOT NULL,
    "headerText" TEXT,
    "footerText" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),
    CONSTRAINT "receipt_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "receipt_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "receipt_templates_org_name_unique" ON "receipt_templates"("organizationId", "name");
CREATE INDEX "receipt_templates_org_id_idx" ON "receipt_templates"("organizationId");
CREATE INDEX "receipt_templates_org_default_idx" ON "receipt_templates"("organizationId", "isDefault");
