import { PrismaClient } from '@prisma/client';
import type {
  IInventoryReportRepository,
  StockReportFilters,
  StockReportItem,
  StockMovementFilters,
  StockMovementReportItem,
  LowStockFilters,
  LowStockItem,
  OutOfStockFilters,
  OutOfStockItem,
} from './inventory-report.repository.js';
import type { ReportPaginatedResponse } from '../../../shared/types/report-filter.js';

export class InventoryReportRepositoryImpl implements IInventoryReportRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async getCurrentStock(
    filters: StockReportFilters,
  ): Promise<ReportPaginatedResponse<StockReportItem>> {
    const productWhere: Record<string, unknown> = {};
    if (filters.activeOnly) {
      productWhere.isActive = true;
    }
    if (filters.categoryId) {
      productWhere.categoryId = filters.categoryId;
    }
    if (filters.brandId) {
      productWhere.brandId = filters.brandId;
    }

    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
    };

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (Object.keys(productWhere).length > 0) {
      where.product = productWhere;
    }

    if (filters.search) {
      where.OR = [
        { product: { name: { contains: filters.search, mode: 'insensitive' } } },
        { product: { sku: { contains: filters.search, mode: 'insensitive' } } },
        { product: { code: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this._prisma.stock.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          quantity: true,
          reservedQuantity: true,
          warehouse: { select: { name: true } },
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: { select: { name: true } },
            },
          },
        },
      }),
      this._prisma.stock.count({ where }),
    ]);

    const result: StockReportItem[] = items.map((stock) => ({
      productId: stock.product.id,
      sku: stock.product.sku,
      name: stock.product.name,
      warehouse: stock.warehouse.name,
      quantity: Number(stock.quantity),
      reserved: Number(stock.reservedQuantity),
      available: Number(stock.quantity) - Number(stock.reservedQuantity),
      unit: stock.product.unit.name,
    }));

    const totalPages = Math.ceil(total / filters.limit) || 0;
    return { items: result, total, page: filters.page, limit: filters.limit, totalPages };
  }

  async getStockMovements(
    filters: StockMovementFilters,
  ): Promise<ReportPaginatedResponse<StockMovementReportItem>> {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
    };

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, Date>).gte = filters.from;
      if (filters.to) (where.createdAt as Record<string, Date>).lte = filters.to;
    }

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.movementType) {
      where.type = filters.movementType;
    }

    if (filters.performedBy) {
      where.performedBy = filters.performedBy;
    }

    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [items, total] = await Promise.all([
      this._prisma.stockMovement.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          createdAt: true,
          type: true,
          quantity: true,
          referenceType: true,
          referenceId: true,
          performedBy: true,
          product: { select: { name: true } },
          stock: { select: { quantity: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this._prisma.stockMovement.count({ where }),
    ]);

    const result: StockMovementReportItem[] = [];

    for (const movement of items) {
      let referenceNumber: string | null = null;

      if (movement.referenceType === 'SALE' && movement.referenceId) {
        const sale = await this._prisma.sale.findUnique({
          where: { id: movement.referenceId },
          select: { number: true },
        });
        referenceNumber = sale?.number ?? null;
      }

      result.push({
        date: movement.createdAt,
        product: movement.product.name,
        type: movement.type,
        quantity: Number(movement.quantity),
        balanceAfter: Number(movement.stock.quantity),
        referenceType: movement.referenceType,
        referenceNumber,
        performedBy: movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : null,
      });
    }

    const totalPages = Math.ceil(total / filters.limit) || 0;
    return { items: result, total, page: filters.page, limit: filters.limit, totalPages };
  }

  async getLowStock(filters: LowStockFilters): Promise<ReportPaginatedResponse<LowStockItem>> {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
      quantity: { gt: 0 },
    };

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    const productWhere: Record<string, unknown> = {};
    if (filters.categoryId) {
      productWhere.categoryId = filters.categoryId;
    }
    if (filters.brandId) {
      productWhere.brandId = filters.brandId;
    }

    const stocks = await this._prisma.stock.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        product: {
          include: {
            unit: { select: { name: true } },
            ...(Object.keys(productWhere).length > 0 ? { where: productWhere } : {}),
          },
        },
        warehouse: { select: { name: true } },
      },
    });

    const lowStockItems = stocks.filter((stock) => {
      const threshold = stock.product.lowStockThreshold ?? 0;
      return Number(stock.quantity) > 0 && Number(stock.quantity) <= threshold;
    });

    const skip = (filters.page - 1) * filters.limit;
    const result: LowStockItem[] = lowStockItems.slice(skip, skip + filters.limit).map((stock) => ({
      productId: stock.product.id,
      sku: stock.product.sku,
      name: stock.product.name,
      warehouse: stock.warehouse.name,
      quantity: Number(stock.quantity),
      lowStockThreshold: stock.product.lowStockThreshold ?? 0,
      unit: stock.product.unit.name,
    }));

    const total = lowStockItems.length;
    const totalPages = Math.ceil(total / filters.limit) || 0;
    return { items: result, total, page: filters.page, limit: filters.limit, totalPages };
  }

  async getOutOfStock(
    filters: OutOfStockFilters,
  ): Promise<ReportPaginatedResponse<OutOfStockItem>> {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
      quantity: 0,
    };

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    const [items, total] = await Promise.all([
      this._prisma.stock.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          quantity: true,
          warehouse: { select: { name: true } },
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: { select: { name: true } },
            },
          },
        },
      }),
      this._prisma.stock.count({ where }),
    ]);

    const result: OutOfStockItem[] = items.map((stock) => ({
      productId: stock.product.id,
      sku: stock.product.sku,
      name: stock.product.name,
      warehouse: stock.warehouse.name,
      quantity: Number(stock.quantity),
      unit: stock.product.unit.name,
    }));

    const totalPages = Math.ceil(total / filters.limit) || 0;
    return { items: result, total, page: filters.page, limit: filters.limit, totalPages };
  }
}
