-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "abbreviation" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deletedAt" TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "units_organizationId_idx" ON "units"("organizationId");

-- CreateIndex
CREATE INDEX "units_isActive_idx" ON "units"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "units_organizationId_code_key" ON "units"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "units_organizationId_name_key" ON "units"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
