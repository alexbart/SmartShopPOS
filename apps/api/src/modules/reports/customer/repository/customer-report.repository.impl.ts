import { PrismaClient } from '@prisma/client';
import type {
  ICustomerReportRepository,
  CustomerSummaryFilters,
  CustomerSummaryItem,
  CustomerPurchaseFilters,
  CustomerPurchaseItem,
  TopCustomersFilters,
  TopCustomerItem,
} from './customer-report.repository.js';
import type { ReportPaginatedResponse } from '../../../shared/types/report-filter.js';

export class CustomerReportRepositoryImpl implements ICustomerReportRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async getCustomerSummary(
    filters: CustomerSummaryFilters,
  ): Promise<ReportPaginatedResponse<CustomerSummaryItem>> {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this._prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          code: true,
          name: true,
          sales: {
            where: { status: 'COMPLETED' },
            select: {
              total: true,
              createdAt: true,
            },
          },
        },
      }),
      this._prisma.customer.count({ where }),
    ]);

    const result: CustomerSummaryItem[] = items.map((customer) => {
      const completedSales = customer.sales;
      const transactions = completedSales.length;
      const totalSpent = completedSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const averageSale = transactions > 0 ? totalSpent / transactions : 0;
      const lastPurchase =
        transactions > 0
          ? new Date(Math.max(...completedSales.map((s) => s.createdAt.getTime())))
          : null;

      return {
        customerId: customer.id,
        code: customer.code,
        name: customer.name,
        transactions,
        totalSpent,
        averageSale,
        lastPurchase,
      };
    });

    const totalPages = Math.ceil(total / filters.limit) || 0;
    return { items: result, total, page: filters.page, limit: filters.limit, totalPages };
  }

  async getCustomerPurchases(
    filters: CustomerPurchaseFilters,
  ): Promise<ReportPaginatedResponse<CustomerPurchaseItem>> {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
      customerId: filters.customerId,
      status: 'COMPLETED',
    };

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, Date>).gte = filters.from;
      if (filters.to) (where.createdAt as Record<string, Date>).lte = filters.to;
    }

    if (filters.branchId) {
      where.warehouse = { branchId: filters.branchId };
    }

    const [items, total] = await Promise.all([
      this._prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          number: true,
          createdAt: true,
          total: true,
          cashier: { select: { firstName: true, lastName: true } },
          payments: {
            where: { status: 'PAID' },
            select: { method: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),
      this._prisma.sale.count({ where }),
    ]);

    const result: CustomerPurchaseItem[] = items.map((sale) => ({
      invoiceNumber: sale.number,
      date: sale.createdAt,
      amount: Number(sale.total),
      paymentMethod: sale.payments[0]?.method ?? 'CASH',
      cashier: sale.cashier ? `${sale.cashier.firstName} ${sale.cashier.lastName}` : 'Unknown',
    }));

    const totalPages = Math.ceil(total / filters.limit) || 0;
    return { items: result, total, page: filters.page, limit: filters.limit, totalPages };
  }

  async getTopCustomers(filters: TopCustomersFilters): Promise<TopCustomerItem[]> {
    const results = await this._prisma.$queryRawUnsafe<
      Array<{
        customerId: string;
        code: string;
        name: string;
        totalSpent: number;
        transactions: number;
      }>
    >(
      `SELECT
        c.id as "customerId",
        c.code as "code",
        c.name as "name",
        SUM(s."total") as "totalSpent",
        COUNT(s.id) as "transactions"
      FROM "customers" c
      JOIN "sales" s ON s."customerId" = c.id
      WHERE s."organizationId"::text = $1
        AND s.status = 'COMPLETED'
      GROUP BY c.id, c.code, c.name
      ORDER BY SUM(s."total") DESC
      LIMIT $2`,
      filters.organizationId,
      filters.limit,
    );

    return results.map((row) => ({
      customerId: row.customerId,
      code: row.code,
      name: row.name,
      totalSpent: Number(row.totalSpent),
      transactions: Number(row.transactions),
    }));
  }
}
