export interface SalesReportFilters {
  organizationId: string;
  from?: Date;
  to?: Date;
  branchId?: string;
  cashierId?: string;
  customerId?: string;
  paymentMethod?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface SalesReportItem {
  saleNumber: string;
  customer: string;
  cashier: string;
  total: number;
  paymentMethod: string;
  createdAt: Date;
}

export interface SalesReportSummary {
  sales: number;
  grossRevenue: number;
  discounts: number;
  tax: number;
  netRevenue: number;
}

export interface SalesReportPaymentBreakdown {
  cash: number;
  mpesa: number;
  card: number;
  bank: number;
  credit: number;
}

export interface SalesReportResponse {
  summary: SalesReportSummary;
  payments: SalesReportPaymentBreakdown;
  items: SalesReportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ISalesReportRepository {
  // eslint-disable-next-line no-unused-vars
  getSalesReport(filters: SalesReportFilters): Promise<{
    items: SalesReportItem[];
    total: number;
  }>;
  // eslint-disable-next-line no-unused-vars
  getSalesSummary(filters: SalesReportFilters): Promise<SalesReportSummary>;
  // eslint-disable-next-line no-unused-vars
  getPaymentBreakdown(filters: SalesReportFilters): Promise<SalesReportPaymentBreakdown>;
}
