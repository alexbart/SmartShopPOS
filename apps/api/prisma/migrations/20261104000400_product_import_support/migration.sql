ALTER TABLE "products"
  ADD COLUMN "wholesalePrice" DECIMAL(10, 2),
  ADD COLUMN "discountPrice" DECIMAL(10, 2);

CREATE TABLE "product_import_jobs" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "warehouseId" UUID NOT NULL,
  "sourceHash" CHAR(64) NOT NULL,
  "sourceName" VARCHAR(255) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'RUNNING',
  "totalRows" INTEGER NOT NULL,
  "completedRows" INTEGER NOT NULL DEFAULT 0,
  "failedRows" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) NOT NULL,
  "completedAt" TIMESTAMP(6),
  CONSTRAINT "product_import_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_import_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "product_import_jobs_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "product_import_job_source_key" ON "product_import_jobs"("organizationId", "warehouseId", "sourceHash");
CREATE INDEX "product_import_jobs_organizationId_status_idx" ON "product_import_jobs"("organizationId", "status");

CREATE TABLE "product_import_rows" (
  "id" UUID NOT NULL,
  "jobId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "sourceData" JSONB NOT NULL,
  "productId" UUID,
  "error" TEXT,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "product_import_rows_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_import_rows_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "product_import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "product_import_row_job_number_key" ON "product_import_rows"("jobId", "rowNumber");
CREATE INDEX "product_import_rows_jobId_status_idx" ON "product_import_rows"("jobId", "status");
