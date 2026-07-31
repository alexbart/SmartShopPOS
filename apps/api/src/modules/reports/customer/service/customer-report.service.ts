import type {
  ICustomerReportRepository,
  CustomerSummaryFilters,
  CustomerSummaryItem,
  CustomerPurchaseFilters,
  CustomerPurchaseItem,
  TopCustomersFilters,
  TopCustomerItem,
} from '../repository/customer-report.repository.js';

export class CustomerReportService {
  constructor(private readonly _repository: ICustomerReportRepository) {}

  async getCustomerSummary(
    filters: CustomerSummaryFilters,
  ): Promise<{ items: CustomerSummaryItem[]; pagination: Record<string, number> }> {
    const result = await this._repository.getCustomerSummary(filters);
    return {
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getCustomerPurchases(
    filters: CustomerPurchaseFilters,
  ): Promise<{ items: CustomerPurchaseItem[]; pagination: Record<string, number> }> {
    const result = await this._repository.getCustomerPurchases(filters);
    return {
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getTopCustomers(filters: TopCustomersFilters): Promise<TopCustomerItem[]> {
    return this._repository.getTopCustomers(filters);
  }
}
