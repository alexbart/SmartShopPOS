export interface IDashboardRepository {
  getTodaySales(_organizationId: string): Promise<number>;
  getTodayTransactionCount(_organizationId: string): Promise<number>;
  getTodayCustomerCount(_organizationId: string): Promise<number>;
  getSalesTrend(_organizationId: string): Promise<Array<{ date: string; amount: number }>>;
  getPaymentMix(_organizationId: string): Promise<Array<{ method: string; amount: number }>>;
  getLowStockProducts(_organizationId: string): Promise<number>;
  getOutOfStockProducts(_organizationId: string): Promise<number>;
  getTopSellingProducts(
    _organizationId: string,
    _limit: number,
  ): Promise<Array<{ productId: string; name: string; quantitySold: number }>>;
  getRecentSales(
    _organizationId: string,
    _limit: number,
  ): Promise<
    Array<{
      saleNumber: string;
      customerName: string;
      amount: number;
      status: string;
    }>
  >;
}

export interface DashboardResponse {
  today: {
    sales: number;
    transactions: number;
    customers: number;
  };
  inventory: {
    lowStock: number;
    outOfStock: number;
  };
  salesTrend: Array<{ date: string; amount: number }>;
  paymentMix: Array<{ method: string; amount: number }>;
  topProducts: Array<{
    productId: string;
    name: string;
    quantitySold: number;
  }>;
  recentSales: Array<{
    saleNumber: string;
    customer: string;
    amount: number;
    status: string;
  }>;
}
