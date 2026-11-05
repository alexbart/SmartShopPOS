import { createHash } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  productImportRowSchema,
  type ProductImportRowInput,
  type ProductImportStatus,
} from '../dto/product-import.dto.js';
import { MovementTypes } from '../../../shared/constants/domain-constants.js';
import { writeHashedAuditEvent } from '../../audit/audit-chain.js';
import { PRODUCT_IMPORT_COLUMNS } from './product-import-columns.js';

const DEFAULT_CHUNK_SIZE = 50;
const MAX_ROWS_PER_RUN = 5000;
const IMPORT_REFERENCE_TYPE = 'PRODUCT_IMPORT';

/** Says how to fix a name that was not in the catalog, in the user's own terms. */
const REFERENCE_HINTS = {
  unit: 'Add it under Catalog > Units, then upload again.',
  category: 'Add it under Catalog > Categories, then upload again.',
  brand: 'Add it under Catalog > Brands, then upload again.',
  tax: 'Add it under Catalog > Taxes, then upload again.',
} as const;

const FIELD_TO_COLUMN_KEY: Record<string, string> = {
  unitId: 'unit',
  unitName: 'unit',
  categoryId: 'category',
  categoryName: 'category',
  brandId: 'brand',
  brandName: 'brand',
  taxId: 'tax',
  taxName: 'tax',
};

const HEADER_BY_COLUMN_KEY = new Map<string, string>(
  PRODUCT_IMPORT_COLUMNS.map((column) => [column.key, column.header]),
);

/** Catalog lookups loaded once per job: keyed by id, name and code. */
export interface ProductImportReferences {
  units: Map<string, string>;
  categories: Map<string, string>;
  brands: Map<string, string>;
  taxes: Map<string, string>;
}

function indexReferences(items: Array<{ id: string; name: string; code: string }>) {
  const index = new Map<string, string>();
  for (const item of items) {
    index.set(item.id, item.id);
    for (const key of [item.name, item.code]) {
      const normalized = key?.trim().toLowerCase();
      if (normalized && !index.has(normalized)) index.set(normalized, item.id);
    }
  }
  return index;
}

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
    unitName: toTrimmedString(sourceData.unitName),
    sku: toTrimmedString(sourceData.sku),
    barcode: toTrimmedString(sourceData.barcode),
    description: toTrimmedString(sourceData.description),
    categoryId: toTrimmedString(sourceData.categoryId) ?? null,
    categoryName: toTrimmedString(sourceData.categoryName) ?? null,
    brandId: toTrimmedString(sourceData.brandId) ?? null,
    brandName: toTrimmedString(sourceData.brandName) ?? null,
    taxId: toTrimmedString(sourceData.taxId) ?? null,
    taxName: toTrimmedString(sourceData.taxName) ?? null,
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
    .map((issue) => {
      const field = issue.path.find((part) => typeof part === 'string') as string | undefined;
      if (!field) return issue.message;
      // Quote the spreadsheet header rather than the internal field name.
      const header = HEADER_BY_COLUMN_KEY.get(FIELD_TO_COLUMN_KEY[field] ?? field);
      return header ? `${header}: ${issue.message}` : `${field}: ${issue.message}`;
    })
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
      /** Cap on rows handled by this call, so the UI can show steady progress. */
      limit?: number;
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
    const rowLimit =
      options.limit && options.limit > 0
        ? Math.min(options.limit, MAX_ROWS_PER_RUN)
        : MAX_ROWS_PER_RUN;

    const job = await this._prisma.productImportJob.findFirst({
      where: { id: jobId, organizationId },
      include: {
        rows: {
          where: { status: { in: ['PENDING', 'FAILED'] } },
          orderBy: { rowNumber: 'asc' },
          take: rowLimit,
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

    // One catalog read for the whole run: resolving names per row would mean
    // thousands of lookups on a 500-row spreadsheet.
    const references = await this._loadReferences(organizationId);

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
          references,
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

    // Only a transition into a terminal state is audited. Retrying the same
    // failing file would otherwise bury the audit centre in duplicates.
    if (pending === 0 && job.status !== status) {
      await this._recordImportAudit({
        organizationId,
        userId,
        jobId: job.id,
        sourceName: job.sourceName,
        warehouseId: job.warehouseId,
        totalRows: job.totalRows,
        status,
        successful,
        failed,
        skipped,
      });
    }

    return this.getJobResult(jobId, organizationId);
  }

  /** Name and code lookups for every catalog a product row can reference. */
  private async _loadReferences(organizationId: string): Promise<ProductImportReferences> {
    const scope = { organizationId, deletedAt: null };
    const select = { id: true, name: true, code: true } as const;

    const [units, categories, brands, taxes] = await Promise.all([
      this._prisma.unit.findMany({ where: scope, select }),
      this._prisma.category.findMany({ where: scope, select }),
      this._prisma.brand.findMany({ where: scope, select }),
      this._prisma.tax.findMany({ where: scope, select }),
    ]);

    return {
      units: indexReferences(units),
      categories: indexReferences(categories),
      brands: indexReferences(brands),
      taxes: indexReferences(taxes),
    };
  }

  /**
   * Accepts either an id or the name/code typed into the spreadsheet. The
   * catalog maps are organization-scoped, so a name from another tenant can
   * never be resolved by accident.
   */
  private _resolveReference(
    index: Map<string, string>,
    reference: { id?: string | null; name?: string | null },
    label: string,
    hint: string,
  ): string | null {
    const supplied = reference.id ?? reference.name;
    if (!supplied) return null;

    const resolved = index.get(supplied) ?? index.get(supplied.trim().toLowerCase());
    if (!resolved) {
      throw new Error(`${label} '${supplied}' was not found in this organization. ${hint}`);
    }
    return resolved;
  }

  private async _recordImportAudit(event: {
    organizationId: string;
    userId: string;
    jobId: string;
    sourceName: string;
    warehouseId: string;
    totalRows: number;
    status: ProductImportStatus;
    successful: number;
    failed: number;
    skipped: number;
  }) {
    const parts = [
      `${event.successful} created`,
      event.skipped > 0 ? `${event.skipped} skipped` : undefined,
      event.failed > 0 ? `${event.failed} failed` : undefined,
    ].filter(Boolean);

    try {
      await writeHashedAuditEvent(this._prisma, {
        organizationId: event.organizationId,
        actorId: event.userId,
        action: 'IMPORT',
        entity: 'ProductImportJob',
        entityId: event.jobId,
        outcome: event.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
        summary: `Imported '${event.sourceName}': ${parts.join(', ')}`,
        newValues: {
          fileName: event.sourceName,
          warehouseId: event.warehouseId,
          status: event.status,
          totalRows: event.totalRows,
          successfulRows: event.successful,
          skippedRows: event.skipped,
          failedRows: event.failed,
        },
      });
    } catch {
      // The products are already created; losing an audit row must not fail the import.
    }
  }

  async processRow(
    row: { rowNumber: number; sourceData: Record<string, unknown> },
    organizationId: string,
    warehouseId: string,
    userId: string,
    jobId: string,
    references?: ProductImportReferences,
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

    // Names typed into the spreadsheet are resolved against this organization's
    // own catalog before anything is written, so a typo fails the row with a fix.
    let unitId: string | null;
    let categoryId: string | null;
    let brandId: string | null;
    let taxId: string | null;
    try {
      const catalogs = references ?? (await this._loadReferences(organizationId));
      unitId = this._resolveReference(
        catalogs.units,
        { id: input.unitId, name: input.unitName },
        'Unit',
        REFERENCE_HINTS.unit,
      );
      categoryId = this._resolveReference(
        catalogs.categories,
        { id: input.categoryId, name: input.categoryName },
        'Category',
        REFERENCE_HINTS.category,
      );
      brandId = this._resolveReference(
        catalogs.brands,
        { id: input.brandId, name: input.brandName },
        'Brand',
        REFERENCE_HINTS.brand,
      );
      taxId = this._resolveReference(
        catalogs.taxes,
        { id: input.taxId, name: input.taxName },
        'Tax rate',
        REFERENCE_HINTS.tax,
      );
    } catch (error) {
      return {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    if (!unitId) {
      return { status: 'FAILED', error: 'Unit is required - fill in the Unit column.' };
    }

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

        const product = await tx.product.create({
          data: {
            organizationId,
            name,
            code,
            sku,
            barcode,
            description,
            categoryId,
            brandId,
            unitId,
            taxId,
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
