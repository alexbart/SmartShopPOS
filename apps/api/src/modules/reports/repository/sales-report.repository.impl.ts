import { PrismaClient } from '@prisma/client';
import type {
  ISalesReportRepository,
  SalesReportFilters,
  SalesReportItem,
  SalesReportSummary,
  SalesReportPaymentBreakdown,
} from './sales-report.repository.js';

export class SalesReportRepositoryImpl implements ISalesReportRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async getSalesReport(
    filters: SalesReportFilters,
  ): Promise<{ items: SalesReportItem[]; total: number }> {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
    };

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, Date>).gte = filters.from;
      if (filters.to) (where.createdAt as Record<string, Date>).lte = filters.to;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.branchId) {
      where.warehouse = { branchId: filters.branchId };
    }

    if (filters.cashierId) {
      where.cashierId = filters.cashierId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    const [items, total] = await Promise.all([
      this._prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          number: true,
          total: true,
          createdAt: true,
          status: true,
          customer: { select: { name: true } },
          cashier: { select: { firstName: true, lastName: true } },
        },
      }),
      this._prisma.sale.count({ where }),
    ]);

    const itemsWithPayment: SalesReportItem[] = [];

    for (const sale of items) {
      const payment = await this._prisma.payment.findFirst({
        where: { saleId: sale.id, status: 'PAID' },
        orderBy: { createdAt: 'asc' },
        select: { method: true },
      });

      itemsWithPayment.push({
        saleNumber: sale.number,
        customer: sale.customer?.name ?? 'Walk-in Customer',
        cashier: sale.cashier ? `${sale.cashier.firstName} ${sale.cashier.lastName}` : 'Unknown',
        total: Number(sale.total),
        paymentMethod: payment?.method ?? 'CASH',
        createdAt: sale.createdAt,
      });
    }

    return {
      items: itemsWithPayment,
      total,
    };
  }

  async getSalesSummary(filters: SalesReportFilters): Promise<SalesReportSummary> {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
    };

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, Date>).gte = filters.from;
      if (filters.to) (where.createdAt as Record<string, Date>).lte = filters.to;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.branchId) {
      where.warehouse = { branchId: filters.branchId };
    }

    if (filters.cashierId) {
      where.cashierId = filters.cashierId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    const result = await this._prisma.sale.aggregate({
      where,
      _sum: {
        total: true,
        discount: true,
        tax: true,
      },
      _count: {
        _all: true,
      },
    });

    return {
      sales: Number(result._count._all),
      grossRevenue: Number(result._sum.total ?? 0),
      discounts: Number(result._sum.discount ?? 0),
      tax: Number(result._sum.tax ?? 0),
      netRevenue: Number(result._sum.total ?? 0) - Number(result._sum.discount ?? 0),
    };
  }

  async getPaymentBreakdown(filters: SalesReportFilters): Promise<SalesReportPaymentBreakdown> {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
      status: 'PAID',
    };

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, Date>).gte = filters.from;
      if (filters.to) (where.createdAt as Record<string, Date>).lte = filters.to;
    }

    if (filters.paymentMethod) {
      where.method = filters.paymentMethod;
    }

    const results = await this._prisma.payment.groupBy({
      where,
      by: ['method'],
      _sum: { amount: true },
    });

    const breakdown: SalesReportPaymentBreakdown = {
      cash: 0,
      mpesa: 0,
      card: 0,
      bank: 0,
      credit: 0,
    };

    for (const row of results) {
      const key = row.method.toLowerCase() as keyof SalesReportPaymentBreakdown;
      if (key in breakdown) {
        breakdown[key] = Number(row._sum.amount ?? 0);
      }
    }

    return breakdown;
  }
}
