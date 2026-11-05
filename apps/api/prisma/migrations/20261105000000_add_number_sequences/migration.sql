-- Recreated migration. The table exists in deployed databases but this file was
-- lost from the repository, which left prisma migrate unable to reach a clean
-- state (P3009). Written idempotently so it is safe on both existing and fresh
-- databases.
CREATE TABLE IF NOT EXISTS "number_sequences" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "prefix" VARCHAR(20) NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "number_sequences_organizationId_entityType_key" ON "number_sequences"("organizationId", "entityType");

CREATE INDEX IF NOT EXISTS "number_sequences_organizationId_idx" ON "number_sequences"("organizationId");

DO $$ BEGIN
    ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;