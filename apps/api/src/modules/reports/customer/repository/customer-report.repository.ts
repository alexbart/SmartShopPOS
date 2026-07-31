import type { ReportFilter, ReportPaginatedResponse } from '../../../shared/types/report-filter.js';

export interface CustomerSummaryFilters extends ReportFilter {
  search?: string;
  isActive?: boolean;
}

export interface CustomerSummaryItem {
  customerId: string;
  code: string;
  name: string;
  transactions: number;
  totalSpent: number;
  averageSale: number;
  lastPurchase: Date | null;
}

export interface CustomerPurchaseFilters extends ReportFilter {
  customerId: string;
  from?: Date;
  to?: Date;
  branchId?: string;
}

export interface CustomerPurchaseItem {
  invoiceNumber: string;
  date: Date;
  amount: number;
  paymentMethod: string;
  cashier: string;
}

export interface TopCustomerItem {
  customerId: string;
  code: string;
  name: string;
  totalSpent: number;
  transactions: number;
}

export interface TopCustomersFilters {
  organizationId: string;
  limit: number;
}

export interface ICustomerReportRepository {
  // eslint-disable-next-line no-unused-vars
  getCustomerSummary(
    filters: CustomerSummaryFilters,
  ): Promise<ReportPaginatedResponse<CustomerSummaryItem>>;
  // eslint-disable-next-line no-unused-vars
  getCustomerPurchases(
    filters: CustomerPurchaseFilters,
  ): Promise<ReportPaginatedResponse<CustomerPurchaseItem>>;
  // eslint-disable-next-line no-unused-vars
  getTopCustomers(filters: TopCustomersFilters): Promise<TopCustomerItem[]>;
}
