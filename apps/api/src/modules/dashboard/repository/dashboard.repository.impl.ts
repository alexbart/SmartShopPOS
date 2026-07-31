import { PrismaClient } from '@prisma/client';
import type { IDashboardRepository } from './dashboard.repository.js';

export class DashboardRepositoryImpl implements IDashboardRepository {
  constructor(private readonly _prisma: PrismaClient) {}

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
    const count = await this._prisma.$queryRaw<
      Array<{ count: number }>
    >`
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
    const count = await this._prisma.$queryRaw<
      Array<{ count: number }>
    >`
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
