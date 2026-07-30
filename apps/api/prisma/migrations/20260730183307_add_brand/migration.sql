-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deletedAt" TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brands_organizationId_idx" ON "brands"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_organizationId_code_key" ON "brands"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "brands_organizationId_name_key" ON "brands"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
