import { PrismaClient } from '@prisma/client';
import type { IDashboardRepository } from './dashboard.repository.js';

export class DashboardRepositoryImpl implements IDashboardRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  private _sevenDayWindow() {
    const today = new Date();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return { start, end };
  }

  private _dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getSalesTrend(_organizationId: string) {
    const { start, end } = this._sevenDayWindow();
    const sales = await this._prisma.sale.findMany({
      where: {
        organizationId: _organizationId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      select: { createdAt: true, total: true },
    });
    const totals = new Map<string, number>();
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(start);
      date.setDate(date.getDate() + offset);
      totals.set(this._dateKey(date), 0);
    }
    for (const sale of sales) {
      const key = this._dateKey(sale.createdAt);
      totals.set(key, (totals.get(key) ?? 0) + Number(sale.total));
    }
    return [...totals].map(([date, amount]) => ({ date, amount }));
  }

  async getPaymentMix(_organizationId: string) {
    const { start, end } = this._sevenDayWindow();
    const payments = await this._prisma.payment.findMany({
      where: {
        organizationId: _organizationId,
        status: 'PAID',
        paidAt: { gte: start, lte: end },
      },
      select: { method: true, amount: true },
    });
    const totals = new Map<string, number>();
    for (const payment of payments) {
      totals.set(payment.method, (totals.get(payment.method) ?? 0) + Number(payment.amount));
    }
    return [...totals].map(([method, amount]) => ({ method, amount }));
  }

  async getTodaySales(_organizationId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await this._prisma.sale.aggregate({
      where: {
        organizationId: _organizationId,
        status: 'COMPLETED',
        createdAt: { gte: startOfDay },
      },
      _sum: { total: true },
    });

    return Number(result._sum.total ?? 0);
  }

  async getTodayTransactionCount(_organizationId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this._prisma.sale.count({
      where: {
        organizationId: _organizationId,
        status: 'COMPLETED',
        createdAt: { gte: startOfDay },
      },
    });

    return count;
  }

  async getTodayCustomerCount(_organizationId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this._prisma.customer.count({
      where: {
        organizationId: _organizationId,
        createdAt: { gte: startOfDay },
      },
    });

    return count;
  }

  async getLowStockProducts(_organizationId: string) {
    const count = await this._prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM "stocks" s
      JOIN "products" p ON s."productId" = p."id"
      WHERE s."organizationId" = ${_organizationId}::uuid
      AND s."quantity" > 0
      AND s."quantity" <= p."lowStockThreshold"
    `;

    return Number(count[0]?.count ?? 0);
  }

  async getOutOfStockProducts(_organizationId: string) {
    const count = await this._prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM "stocks" s
      WHERE s."organizationId" = ${_organizationId}::uuid
      AND s."quantity" = 0
    `;

    return Number(count[0]?.count ?? 0);
  }

  async getTopSellingProducts(_organizationId: string, _limit: number) {
    const results = await this._prisma.$queryRaw<
      Array<{
        productId: string;
        name: string;
        quantitySold: number;
      }>
    >`
      SELECT p."id" as "productId", p."name", SUM(si."quantity")::float as "quantitySold"
      FROM "sale_items" si
      JOIN "sales" s ON si."saleId" = s."id"
      JOIN "products" p ON si."productId" = p."id"
      WHERE s."organizationId" = ${_organizationId}::uuid
      AND s."status" = 'COMPLETED'
      GROUP BY p."id", p."name"
      ORDER BY "quantitySold" DESC
      LIMIT ${_limit}
    `;

    return results.map((r) => ({
      productId: r.productId,
      name: r.name,
      quantitySold: Number(r.quantitySold),
    }));
  }

  async getRecentSales(_organizationId: string, _limit: number) {
    const results = await this._prisma.sale.findMany({
      where: {
        organizationId: _organizationId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: _limit,
      select: {
        number: true,
        customer: {
          select: {
            name: true,
          },
        },
        total: true,
        status: true,
      },
    });

    return results.map((sale) => ({
      saleNumber: sale.number,
      customerName: sale.customer?.name ?? 'Walk-in Customer',
      amount: Number(sale.total),
      status: sale.status,
    }));
  }
}
