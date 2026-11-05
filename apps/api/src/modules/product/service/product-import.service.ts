import { createHash } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  productImportRowSchema,
  type ProductImportRowInput,
  type ProductImportStatus,
} from '../dto/product-import.dto.js';
import { MovementTypes } from '../../../shared/constants/domain-constants.js';

const DEFAULT_CHUNK_SIZE = 50;
const MAX_ROWS_PER_RUN = 5000;
const IMPORT_REFERENCE_TYPE = 'PRODUCT_IMPORT';

export interface ProductImportRowProcessed extends ProductImportRowInput {
  rowNumber: number;
  originalData: Record<string, unknown>;
}

export interface ImportJobContext {
  jobId: string;
  organizationId: string;
  warehouseId: string;
  sourceName?: string;
  userId: string;
}

/**
 * Import payloads arrive as loosely typed JSON (often straight from a CSV parse), so values are
 * coerced to the shape the Zod schema expects before validation instead of being cast blindly.
 */
function toTrimmedString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : Number(trimmed);
  }
  return Number.NaN;
}

function toBoolean(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '') return undefined;
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return value;
}

function normalizeImportRow(sourceData: Record<string, unknown>) {
  return {
    name: toTrimmedString(sourceData.name),
    code: toTrimmedString(sourceData.code),
    unitId: toTrimmedString(sourceData.unitId),
    sku: toTrimmedString(sourceData.sku),
    barcode: toTrimmedString(sourceData.barcode),
    description: toTrimmedString(sourceData.description),
    categoryId: toTrimmedString(sourceData.categoryId) ?? null,
    brandId: toTrimmedString(sourceData.brandId) ?? null,
    taxId: toTrimmedString(sourceData.taxId) ?? null,
    costPrice: toNumber(sourceData.costPrice),
    sellingPrice: toNumber(sourceData.sellingPrice),
    wholesalePrice: toNumber(sourceData.wholesalePrice) ?? null,
    discountPrice: toNumber(sourceData.discountPrice) ?? null,
    lowStockThreshold: toNumber(sourceData.lowStockThreshold),
    initialStock: toNumber(sourceData.initialStock),
    isActive: toBoolean(sourceData.isActive),
  };
}

function formatIssues(issues: ReadonlyArray<{ path: Array<string | number>; message: string }>) {
  return issues
    .map((issue) =>
      issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
    )
    .join('; ');
}

function describeConflict(
  existing: { code: string; name: string; sku: string | null },
  incoming: { code: string; name: string; sku?: string },
) {
  const conflicts: string[] = [];
  if (existing.code.toUpperCase() === incoming.code) conflicts.push(`code '${existing.code}'`);
  if (existing.name.toLowerCase() === incoming.name.toLowerCase()) {
    conflicts.push(`name '${existing.name}'`);
  }
  if (incoming.sku && existing.sku?.toUpperCase() === incoming.sku) {
    conflicts.push(`SKU '${existing.sku}'`);
  }
  return conflicts.length > 0 ? conflicts.join(' or ') : 'code, name, or SKU';
}

export class ProductImportService {
  constructor(private readonly _prisma: PrismaClient) {}

  /**
   * A job fingerprint. The row count and timestamp keep it unique per submission, so the
   * (organizationId, warehouseId, sourceHash) unique index no longer blocks a repeat import of
   * the same file.
   */
  private buildSourceHash(
    organizationId: string,
    warehouseId: string,
    sourceName: string | undefined,
    rowCount: number,
  ) {
    return createHash('sha256')
      .update(
        `${organizationId}:${warehouseId}:${sourceName ?? 'Product Import'}:${rowCount}:${Date.now()}`,
      )
      .digest('hex');
  }

  private resolveJobStatus(
    storedStatus: string,
    counts: {
      totalRows: number;
      pending: number;
      successful: number;
      failed: number;
      skipped: number;
    },
  ): ProductImportStatus {
    if (counts.pending > 0) {
      return storedStatus === 'PENDING' ? 'PENDING' : 'PROCESSING';
    }
    if (counts.totalRows === 0) return 'COMPLETED';
    if (counts.successful === 0) return 'FAILED';
    if (counts.failed > 0 || counts.skipped > 0) return 'PARTIAL';
    return 'COMPLETED';
  }

  async createImportJob(
    organizationId: string,
    warehouseId: string,
    sourceName: string | undefined,
    _userId: string,
  ) {
    const sourceHash = this.buildSourceHash(organizationId, warehouseId, sourceName, 0);
    const job = await this._prisma.productImportJob.create({
      data: {
        organizationId,
        warehouseId,
        sourceHash,
        sourceName: sourceName ?? 'Product Import',
        status: 'PENDING',
        totalRows: 0,
        completedRows: 0,
      },
    });

    return job;
  }

  async createImportJobWithRows(
    context: {
      organizationId: string;
      warehouseId: string;
      sourceName: string | undefined;
      userId: string;
    },
    rows: { rowNumber: number; data: Record<string, unknown> }[],
  ) {
    const sourceHash = this.buildSourceHash(
      context.organizationId,
      context.warehouseId,
      context.sourceName,
      rows.length,
    );
    const job = await this._prisma.productImportJob.create({
      data: {
        organizationId: context.organizationId,
        warehouseId: context.warehouseId,
        sourceHash,
        sourceName: context.sourceName ?? 'Product Import',
        status: 'PENDING',
        totalRows: rows.length,
        completedRows: 0,
      },
    });

    if (rows.length > 0) {
      const rowData = rows.map((row) => ({
        jobId: job.id,
        rowNumber: row.rowNumber,
        sourceData: row.data as Prisma.InputJsonValue,
        status: 'PENDING',
      }));
      await this._prisma.productImportRow.createMany({
        data: rowData,
      });
    }

    return job;
  }

  async getImportJobStatus(jobId: string, organizationId: string) {
    const job = await this._prisma.productImportJob.findFirst({
      where: { id: jobId, organizationId },
      include: {
        rows: {
          select: {
            rowNumber: true,
            status: true,
            productId: true,
            error: true,
            createdAt: true,
          },
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!job) {
      return null;
    }

    const pendingRows = job.rows.filter((row) => row.status === 'PENDING').length;
    const successfulRows = job.rows.filter((row) => row.status === 'SUCCESS').length;
    const failedRows = job.rows.filter((row) => row.status === 'FAILED').length;
    const skippedRows = job.rows.filter((row) => row.status === 'SKIPPED').length;

    return {
      jobId: job.id,
      status: this.resolveJobStatus(job.status, {
        totalRows: job.totalRows,
        pending: pendingRows,
        successful: successfulRows,
        failed: failedRows,
        skipped: skippedRows,
      }),
      totalRows: job.totalRows,
      processedRows: successfulRows + failedRows + skippedRows,
      successfulRows,
      failedRows,
      skippedRows,
      currentRow: job.rows.find((row) => row.status === 'PENDING')?.rowNumber,
      startedAt: job.createdAt,
      completedAt: job.completedAt ?? undefined,
    };
  }

  async processImportJob(
    jobId: string,
    organizationId: string,
    userId: string,
    options: {
      chunkSize?: number;
      onProgress?: (_progress: { processed: number; total: number; currentRow: number }) => void;
    } = {},
  ): Promise<{
    jobId: string;
    status: ProductImportStatus;
    results: Array<{
      rowNumber: number;
      status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
      productId?: string | null;
      error?: string | null;
      data?: { name: string; code: string; sku?: string; barcode?: string };
    }>;
    summary: {
      total: number;
      processed: number;
      successful: number;
      failed: number;
      skipped: number;
    };
  }> {
    const chunkSize = Math.max(1, options.chunkSize ?? DEFAULT_CHUNK_SIZE);

    const job = await this._prisma.productImportJob.findFirst({
      where: { id: jobId, organizationId },
      include: {
        rows: {
          where: { status: { in: ['PENDING', 'FAILED'] } },
          orderBy: { rowNumber: 'asc' },
          take: MAX_ROWS_PER_RUN,
        },
      },
    });

    if (!job) {
      throw new Error('Import job not found');
    }

    if (job.rows.length === 0) {
      // Nothing left to work through: either already finished or the job never had rows.
      return this.getJobResult(jobId, organizationId);
    }

    const warehouse = await this._prisma.warehouse.findFirst({
      where: { id: job.warehouseId, organizationId },
      select: { id: true },
    });
    if (!warehouse) {
      throw new Error('Import warehouse was not found for this organization');
    }

    await this._prisma.productImportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', completedAt: null },
    });

    const pendingRows = job.rows;
    const results: Array<{
      rowNumber: number;
      status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
      productId?: string | null;
      error?: string | null;
      data?: { name: string; code: string; sku?: string; barcode?: string };
    }> = [];
    let processedCount = 0;

    for (let i = 0; i < pendingRows.length; i += chunkSize) {
      const chunk = pendingRows.slice(i, i + chunkSize);

      for (const row of chunk) {
        const outcome = await this.processRow(
          { rowNumber: row.rowNumber, sourceData: row.sourceData as Record<string, unknown> },
          organizationId,
          job.warehouseId,
          userId,
          job.id,
        );

        await this._prisma.productImportRow.update({
          where: { id: row.id },
          data: {
            status: outcome.status,
            productId: outcome.productId ?? null,
            error: outcome.error ?? null,
          },
        });

        results.push({
          rowNumber: row.rowNumber,
          status: outcome.status,
          productId: outcome.productId,
          error: outcome.error,
          data: outcome.data,
        });

        processedCount += 1;
        options.onProgress?.({
          processed: processedCount,
          total: pendingRows.length,
          currentRow: row.rowNumber,
        });
      }

      await this._prisma.productImportJob.update({
        where: { id: jobId },
        data: { completedRows: job.completedRows + processedCount },
      });
    }

    // Row statuses are the source of truth for the job outcome, so recount instead of trusting
    // per-chunk tallies (which double-counted on retries and ignored persisted rows).
    const grouped = await this._prisma.productImportRow.groupBy({
      by: ['status'],
      where: { jobId },
      _count: { _all: true },
    });

    const counts = grouped.reduce<Record<string, number>>((totals, entry) => {
      totals[entry.status] = entry._count._all;
      return totals;
    }, {});

    const pending = counts.PENDING ?? 0;
    const successful = counts.SUCCESS ?? 0;
    const failed = counts.FAILED ?? 0;
    const skipped = counts.SKIPPED ?? 0;

    const status = this.resolveJobStatus('PROCESSING', {
      totalRows: job.totalRows,
      pending,
      successful,
      failed,
      skipped,
    });

    await this._prisma.productImportJob.update({
      where: { id: jobId },
      data: {
        status,
        completedRows: successful + failed + skipped,
        failedRows: failed,
        completedAt: pending === 0 ? new Date() : null,
      },
    });

    return this.getJobResult(jobId, organizationId);
  }

  async processRow(
    row: { rowNumber: number; sourceData: Record<string, unknown> },
    organizationId: string,
    warehouseId: string,
    userId: string,
    jobId: string,
  ): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    productId?: string | null;
    error?: string | null;
    data?: { name: string; code: string; sku?: string; barcode?: string };
  }> {
    const parsed = productImportRowSchema.safeParse(normalizeImportRow(row.sourceData));

    if (!parsed.success) {
      return {
        status: 'FAILED',
        error: `Validation failed - ${formatIssues(parsed.error.issues)}`,
      };
    }

    const input = parsed.data;
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    const sku = input.sku?.trim().toUpperCase() || undefined;
    const barcode = input.barcode?.trim() || undefined;
    const description = input.description?.trim() || undefined;
    const initialStock = input.initialStock ?? 0;

    try {
      return await this._prisma.$transaction(async (tx) => {
        const existing = await tx.product.findFirst({
          where: {
            organizationId,
            OR: [
              { code: { equals: code, mode: 'insensitive' as const } },
              { name: { equals: name, mode: 'insensitive' as const } },
              ...(sku ? [{ sku: { equals: sku, mode: 'insensitive' as const } }] : []),
            ],
          },
          select: { code: true, name: true, sku: true },
        });

        if (existing) {
          return {
            status: 'SKIPPED' as const,
            error: `Already exists with the same ${describeConflict(existing, { code, name, sku })}`,
          };
        }

        const unit = await tx.unit.findFirst({
          where: { id: input.unitId, organizationId, deletedAt: null },
          select: { id: true },
        });
        if (!unit) throw new Error(`Unit '${input.unitId}' was not found in this organization`);

        if (input.categoryId) {
          const category = await tx.category.findFirst({
            where: { id: input.categoryId, organizationId, deletedAt: null },
            select: { id: true },
          });
          if (!category) {
            throw new Error(`Category '${input.categoryId}' was not found in this organization`);
          }
        }

        if (input.brandId) {
          const brand = await tx.brand.findFirst({
            where: { id: input.brandId, organizationId, deletedAt: null },
            select: { id: true },
          });
          if (!brand) {
            throw new Error(`Brand '${input.brandId}' was not found in this organization`);
          }
        }

        if (input.taxId) {
          const tax = await tx.tax.findFirst({
            where: { id: input.taxId, organizationId, deletedAt: null },
            select: { id: true },
          });
          if (!tax) {
            throw new Error(`Tax '${input.taxId}' was not found in this organization`);
          }
        }

        const product = await tx.product.create({
          data: {
            organizationId,
            name,
            code,
            sku,
            barcode,
            description,
            categoryId: input.categoryId,
            brandId: input.brandId,
            unitId: input.unitId,
            taxId: input.taxId,
            costPrice: input.costPrice,
            sellingPrice: input.sellingPrice,
            wholesalePrice: input.wholesalePrice ?? null,
            discountPrice: input.discountPrice ?? null,
            lowStockThreshold: input.lowStockThreshold ?? 0,
            isActive: input.isActive,
          },
        });

        // The job's warehouse drives where opening stock lands, so an imported product is
        // immediately sellable instead of existing with no inventory behind it.
        const stock = await tx.stock.upsert({
          where: {
            organizationId_warehouseId_productId: {
              organizationId,
              warehouseId,
              productId: product.id,
            },
          },
          update: {},
          create: { organizationId, warehouseId, productId: product.id },
          select: { id: true, quantity: true },
        });

        if (initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              organizationId,
              warehouseId,
              productId: product.id,
              stockId: stock.id,
              type: MovementTypes.ADJUSTMENT,
              quantity: initialStock,
              referenceType: IMPORT_REFERENCE_TYPE,
              referenceId: jobId,
              performedBy: userId,
              remarks: 'Opening stock recorded by product import.',
            },
          });

          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: Number(stock.quantity) + initialStock },
          });
        }

        return {
          status: 'SUCCESS' as const,
          productId: product.id,
          data: {
            name,
            code,
            sku,
            barcode,
          },
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return {
          status: 'SKIPPED',
          error: 'A product with the same code, name, or SKU already exists',
        };
      }

      return {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getJobResult(jobId: string, organizationId: string) {
    const job = await this._prisma.productImportJob.findFirst({
      where: { id: jobId, organizationId },
      include: {
        rows: {
          select: {
            rowNumber: true,
            status: true,
            productId: true,
            error: true,
            createdAt: true,
          },
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!job) {
      throw new Error('Import job not found');
    }

    const pendingRows = job.rows.filter((r) => r.status === 'PENDING').length;
    const successfulRows = job.rows.filter((r) => r.status === 'SUCCESS').length;
    const failedRows = job.rows.filter((r) => r.status === 'FAILED').length;
    const skippedRows = job.rows.filter((r) => r.status === 'SKIPPED').length;

    const status = this.resolveJobStatus(job.status, {
      totalRows: job.totalRows,
      pending: pendingRows,
      successful: successfulRows,
      failed: failedRows,
      skipped: skippedRows,
    });

    const summary = {
      total: job.totalRows,
      processed: successfulRows + failedRows + skippedRows,
      successful: successfulRows,
      failed: failedRows,
      skipped: skippedRows,
    };

    return {
      jobId: job.id,
      status,
      totalRows: job.totalRows,
      processedRows: successfulRows + failedRows + skippedRows,
      successfulRows,
      failedRows,
      skippedRows,
      results: job.rows.map((row) => ({
        rowNumber: row.rowNumber,
        status: row.status as 'SUCCESS' | 'FAILED' | 'SKIPPED',
        productId: row.productId,
        error: row.error,
        data: undefined,
      })),
      summary,
    };
  }
}
