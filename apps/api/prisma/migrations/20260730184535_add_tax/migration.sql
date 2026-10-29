-- CreateTable
CREATE TABLE "taxes" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "rate" DECIMAL(10,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deletedAt" TIMESTAMP,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "taxes_organizationId_idx" ON "taxes"("organizationId");

-- CreateIndex
CREATE INDEX "taxes_isActive_idx" ON "taxes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "taxes_organizationId_code_key" ON "taxes"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "taxes_organizationId_name_key" ON "taxes"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
