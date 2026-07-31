import type {
  IDashboardRepository,
  DashboardResponse,
} from '../repository/dashboard.repository.js';
import type { CacheService } from '../../../shared/services/cache/cache.service.js';

export class DashboardService {
  constructor(
    private readonly _repository: IDashboardRepository,
    private readonly _cache: CacheService,
  ) {}

  private _cacheKey(organizationId: string): string {
    return `dashboard:${organizationId}`;
  }

  async getDashboard(organizationId: string): Promise<DashboardResponse> {
    const cacheKey = this._cacheKey(organizationId);

    const cached = await this._cache.get<DashboardResponse>(cacheKey);
    if (cached) {
      return cached;
    }

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

    const dashboard: DashboardResponse = {
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

    await this._cache.set(cacheKey, dashboard, 300);

    return dashboard;
  }

  async invalidate(organizationId: string): Promise<void> {
    await this._cache.del(this._cacheKey(organizationId));
  }
}
