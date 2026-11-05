import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import type { ProductImportRowInput } from '../dto/product-import.dto.js';
import { Prisma } from '@prisma/client';

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

export class ProductImportService {
  constructor(private readonly _prisma: PrismaClient) {}

  async createImportJob(
    organizationId: string,
    warehouseId: string,
    sourceName: string | undefined,
    _userId: string,
  ) {
    const sourceHash = createHash('sha256')
      .update(`${organizationId}:${warehouseId}:${sourceName ?? 'Product Import'}`)
      .digest('hex');
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
    const sourceHash = createHash('sha256')
      .update(
        `${context.organizationId}:${context.warehouseId}:${context.sourceName ?? 'Product Import'}`,
      )
      .digest('hex');
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

    return {
      jobId: job.id,
      status: job.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL',
      totalRows: job.totalRows,
      processedRows: job.completedRows,
      successfulRows: job.rows.filter((r) => r.status === 'SUCCESS').length,
      failedRows: job.rows.filter((r) => r.status === 'FAILED').length,
      skippedRows: job.rows.filter((r) => r.status === 'SKIPPED').length,
      currentRow: job.rows.find((r) => r.status === 'PENDING')?.rowNumber,
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
    status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
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
    const chunkSize = options.chunkSize ?? 50;

    const job = await this._prisma.productImportJob.findFirst({
      where: { id: jobId, organizationId },
      include: {
        rows: {
          where: { status: { in: ['PENDING', 'FAILED'] } },
          orderBy: { rowNumber: 'asc' },
          take: 1000,
        },
      },
    });

    if (!job) {
      throw new Error('Import job not found');
    }

    if (job.status === 'COMPLETED') {
      return this.getJobResult(job.id, job.organizationId);
    }

    await this._prisma.productImportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    const pendingRows = job.rows.filter((r) => r.status === 'PENDING' || r.status === 'FAILED');
    let processedCount = job.completedRows;
    let successfulCount = 0;
    let failedCount = 0;
    const results: Array<{
      rowNumber: number;
      status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
      productId?: string | null;
      error?: string | null;
      data?: { name: string; code: string; sku?: string; barcode?: string };
    }> = [];

    for (let i = 0; i < pendingRows.length; i += chunkSize) {
      const chunk = pendingRows.slice(i, i + chunkSize);

      for (const row of chunk) {
        try {
          const result = await this.processRow(
            { rowNumber: row.rowNumber, sourceData: row.sourceData as Record<string, unknown> },
            organizationId,
            userId,
          );

          if (result.status === 'SUCCESS') {
            successfulCount++;
          } else if (result.status === 'FAILED') {
            failedCount++;
          }

          results.push({
            rowNumber: row.rowNumber,
            status: result.status,
            productId: result.productId,
            error: result.error,
            data: result.data,
          });

          processedCount++;

          await this._prisma.productImportJob.update({
            where: { id: jobId },
            data: { completedRows: processedCount },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          await this._prisma.productImportRow.update({
            where: { id: row.id },
            data: {
              status: 'FAILED',
              error: errorMessage,
            },
          });

          failedCount++;
          results.push({
            rowNumber: row.rowNumber,
            status: 'FAILED',
            error: errorMessage,
          });
        }
      }

      let finalStatus: 'COMPLETED' | 'PARTIAL' | 'FAILED';
      if (failedCount === 0) {
        finalStatus = 'COMPLETED';
      } else if (successfulCount === 0) {
        finalStatus = 'FAILED';
      } else {
        finalStatus = 'PARTIAL';
      }

      await this._prisma.productImportJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          completedRows: processedCount,
          completedAt: new Date(),
        },
      });

      return this.getJobResult(jobId, job.organizationId);
    }

    return this.getJobResult(jobId, job.organizationId);
  }

  async processRow(
    row: { rowNumber: number; sourceData: Record<string, unknown> },
    organizationId: string,
    _userId: string,
  ): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    productId?: string | null;
    error?: string | null;
    data?: { name: string; code: string; sku?: string; barcode?: string };
  }> {
    const sourceData = row.sourceData as Record<string, unknown>;

    try {
      const name = sourceData.name as string;
      const code = sourceData.code as string;
      const unitId = sourceData.unitId as string;

      if (!name || !name.trim()) {
        throw new Error('Product name is required');
      }
      if (!code || !code.trim()) {
        throw new Error('Product code is required');
      }
      if (!unitId) {
        throw new Error('Unit ID is required');
      }

      const nameStr = name.trim();
      const codeStr = code.trim().toUpperCase();
      const sku = (sourceData.sku as string)?.trim().toUpperCase() || undefined;
      const barcode = (sourceData.barcode as string)?.trim() || undefined;
      const description = (sourceData.description as string)?.trim() || undefined;
      const categoryId = sourceData.categoryId as string | undefined;
      const brandId = sourceData.brandId as string | undefined;
      const taxId = sourceData.taxId as string | undefined;
      const taxIdStr = taxId?.trim();

      const costPrice = Number(sourceData.costPrice);
      const sellingPrice = Number(sourceData.sellingPrice);
      const wholesalePrice = sourceData.wholesalePrice ? Number(sourceData.wholesalePrice) : null;
      const discountPrice = sourceData.discountPrice ? Number(sourceData.discountPrice) : null;
      const lowStockThresholdNum = sourceData.lowStockThreshold
        ? Number(sourceData.lowStockThreshold)
        : undefined;
      const isActive = sourceData.isActive !== undefined ? Boolean(sourceData.isActive) : true;

      if (isNaN(costPrice) || costPrice < 0)
        throw new Error('Cost price must be a valid number >= 0');
      if (isNaN(sellingPrice) || sellingPrice < 0)
        throw new Error('Selling price must be a valid number >= 0');

      const existingProduct = await this._prisma.product.findFirst({
        where: {
          OR: [
            { code: { equals: codeStr, mode: 'insensitive' as const }, organizationId },
            ...(sku
              ? [{ sku: { equals: sku, mode: 'insensitive' as const }, organizationId }]
              : []),
          ],
        },
      });

      if (existingProduct) {
        return {
          status: 'SKIPPED',
          error: `Product with code '${codeStr}'${sku ? ` or SKU '${sku}'` : ''} already exists`,
        };
      }

      const unit = await this._prisma.unit.findUnique({ where: { id: unitId } });
      if (!unit) throw new Error(`Unit with ID ${unitId} not found`);

      if (categoryId) {
        const category = await this._prisma.category.findFirst({ where: { id: categoryId } });
        if (!category) throw new Error(`Category with ID ${categoryId} not found`);
      }

      if (brandId) {
        const brand = await this._prisma.brand.findUnique({ where: { id: brandId } });
        if (!brand) throw new Error(`Brand with ID ${brandId} not found`);
      }

      if (taxIdStr) {
        const tax = await this._prisma.tax.findUnique({ where: { id: taxIdStr } });
        if (!tax) throw new Error(`Tax with ID ${taxIdStr} not found`);
      }

      const product = await this._prisma.product.create({
        data: {
          organizationId,
          name: nameStr,
          code: codeStr,
          sku,
          barcode,
          description,
          categoryId,
          brandId,
          unitId,
          taxId: taxIdStr,
          costPrice,
          sellingPrice,
          wholesalePrice,
          discountPrice,
          lowStockThreshold: lowStockThresholdNum ?? 0,
          isActive,
        },
      });

      return {
        status: 'SUCCESS',
        productId: product.id,
        data: {
          name: nameStr,
          code: codeStr,
          sku,
          barcode,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Unique constraint') || errorMessage.includes('P2002')) {
        return {
          status: 'SKIPPED',
          error: `Product with this code or SKU already exists`,
        };
      }

      return {
        status: 'FAILED',
        error: errorMessage,
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

    const successfulRows = job.rows.filter((r) => r.status === 'SUCCESS').length;
    const failedRows = job.rows.filter((r) => r.status === 'FAILED').length;
    const skippedRows = job.rows.filter((r) => r.status === 'SKIPPED').length;

    let status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
    if (job.status === 'COMPLETED') {
      status = 'COMPLETED';
    } else if (job.status === 'FAILED') {
      status = 'FAILED';
    } else {
      status = 'PARTIAL';
    }

    const summary = {
      total: job.totalRows,
      processed: job.completedRows,
      successful: successfulRows,
      failed: failedRows,
      skipped: skippedRows,
    };

    return {
      jobId: job.id,
      status,
      totalRows: job.totalRows,
      processedRows: job.completedRows,
      successfulRows,
      failedRows: job.rows.filter((r) => r.status === 'FAILED').length,
      skippedRows: job.rows.filter((r) => r.status === 'SKIPPED').length,
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
