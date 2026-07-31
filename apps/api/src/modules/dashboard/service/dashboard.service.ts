import type { IDashboardRepository } from '../repository/dashboard.repository.js';
import type { DashboardResponse } from '../repository/dashboard.repository.js';

export class DashboardService {
  constructor(private readonly _repository: IDashboardRepository) {}

  async getDashboard(organizationId: string): Promise<DashboardResponse> {
    const [sales, transactions, customers, lowStock, outOfStock, topProducts, recentSales] =
      await Promise.all([
        this._repository.getTodaySales(organizationId),
        this._repository.getTodayTransactionCount(organizationId),
        this._repository.getTodayCustomerCount(organizationId),
        this._repository.getLowStockProducts(organizationId),
        this._repository.getOutOfStockProducts(organizationId),
        this._repository.getTopSellingProducts(organizationId, 5),
        this._repository.getRecentSales(organizationId, 10),
      ]);

    return {
      today: {
        sales,
        transactions,
        customers,
      },
      inventory: {
        lowStock,
        outOfStock,
      },
      topProducts,
      recentSales: recentSales.map((sale) => ({
        saleNumber: sale.saleNumber,
        customer: sale.customerName,
        amount: sale.amount,
        status: sale.status,
      })),
    };
  }
}
