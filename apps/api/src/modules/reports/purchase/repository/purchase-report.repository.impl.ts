import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type {
  IPurchaseReportRepository,
  PurchaseReportFilters,
  PurchaseReportItem,
  PurchaseReportSummary,
  TopSupplierItem,
  OutstandingOrderItem,
  LateDeliveryItem,
} from './purchase-report.repository.js';
import type { ReportPaginatedResponse } from '../../../../shared/types/report-filter.js';

export class PurchaseReportRepositoryImpl implements IPurchaseReportRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  // eslint-disable-next-line no-unused-vars
  async getPurchaseSummary(
    filters: PurchaseReportFilters,
  ): Promise<ReportPaginatedResponse<PurchaseReportItem>> {
    const { organizationId, page, limit, supplierId, status, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = from;
      if (to) (where.createdAt as Record<string, Date>).lte = to;
    }

    const [items, total] = await Promise.all([
      this._prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          expectedDeliveryDate: true,
          supplier: { select: { name: true } },
        },
      }),
      this._prisma.purchaseOrder.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        purchaseOrderNumber: item.orderNumber,
        supplier: item.supplier?.name ?? 'Unknown',
        total: Number(item.total),
        status: item.status,
        createdAt: item.createdAt,
        expectedDeliveryDate: item.expectedDeliveryDate ?? undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  // eslint-disable-next-line no-unused-vars
  async getPurchaseSummaryTotals(filters: PurchaseReportFilters): Promise<PurchaseReportSummary> {
    const { organizationId, supplierId, status, from, to } = filters;

    const where: Record<string, unknown> = { organizationId };
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = from;
      if (to) (where.createdAt as Record<string, Date>).lte = to;
    }

    const result = await this._prisma.purchaseOrder.aggregate({
      where,
      _sum: { total: true },
      _count: { _all: true },
    });

    const paidResult = await this._prisma.purchaseOrder.aggregate({
      where: { ...where, status: 'RECEIVED' },
      _sum: { total: true },
    });

    const pendingResult = await this._prisma.purchaseOrder.aggregate({
      where: { ...where, status: { not: 'RECEIVED' } },
      _sum: { total: true },
    });

    return {
      totalOrders: Number(result._count._all ?? 0),
      totalAmount: Number(result._sum.total ?? 0),
      pendingAmount: Number(pendingResult._sum.total ?? 0),
      receivedAmount: Number(paidResult._sum.total ?? 0),
    };
  }

  // eslint-disable-next-line no-unused-vars
  async getTopSuppliers(filters: PurchaseReportFilters): Promise<TopSupplierItem[]> {
    const { organizationId, limit = 20 } = filters;

    const results = await this._prisma.purchaseOrder.groupBy({
      where: { organizationId },
      by: ['supplierId'],
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    const items: TopSupplierItem[] = [];
    for (const row of results) {
      const supplier = await this._prisma.supplier.findUnique({
        where: { id: row.supplierId },
        select: { name: true },
      });
      items.push({
        supplierId: row.supplierId,
        supplier: supplier?.name ?? 'Unknown',
        totalSpent: Number(row._sum.total ?? 0),
        orderCount: Number(row._count._all ?? 0),
      });
    }

    return items;
  }

  // eslint-disable-next-line no-unused-vars
  async getOutstandingOrders(
    filters: PurchaseReportFilters,
  ): Promise<ReportPaginatedResponse<OutstandingOrderItem>> {
    const { organizationId, page, limit, supplierId, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId,
      status: { in: ['SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED'] },
    };
    if (supplierId) where.supplierId = supplierId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = from;
      if (to) (where.createdAt as Record<string, Date>).lte = to;
    }

    const [items, total] = await Promise.all([
      this._prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          receivedQuantity: true,
          totalQuantity: true,
          expectedDeliveryDate: true,
          supplier: { select: { name: true } },
        },
      }),
      this._prisma.purchaseOrder.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        purchaseOrderId: item.id,
        orderNumber: item.orderNumber,
        supplier: item.supplier?.name ?? 'Unknown',
        total: Number(item.total),
        receivedQuantity: Number(item.receivedQuantity),
        totalQuantity: Number(item.totalQuantity),
        pendingAmount:
          Number(item.total) *
          (1 - Number(item.receivedQuantity) / (Number(item.totalQuantity) || 1)),
        expectedDeliveryDate: item.expectedDeliveryDate ?? undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  // eslint-disable-next-line no-unused-vars
  async getLateDeliveries(filters: PurchaseReportFilters): Promise<LateDeliveryItem[]> {
    const { organizationId, limit = 50 } = filters;

    const results = await this._prisma.purchaseOrder.findMany({
      where: {
        organizationId,
        expectedDeliveryDate: { lt: new Date() },
        status: { in: ['SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED'] },
      },
      orderBy: { expectedDeliveryDate: 'asc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        expectedDeliveryDate: true,
        supplier: { select: { name: true } },
      },
    });

    return results.map((item) => {
      const expectedDate = item.expectedDeliveryDate;
      const daysLate = Math.floor(
        (Date.now() - (expectedDate?.getTime() ?? Date.now())) / (1000 * 60 * 60 * 24),
      );
      return {
        purchaseOrderId: item.id,
        orderNumber: item.orderNumber,
        supplier: item.supplier?.name ?? 'Unknown',
        expectedDeliveryDate: expectedDate!,
        daysLate,
        total: Number(item.total),
      };
    });
  }
}
