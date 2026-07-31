import { reportRegistry } from '../../../shared/report-registry.js';
import type { ReportDefinition, ReportColumn } from '../../../shared/report-registry.js';
import type {
  ICustomerReportRepository,
  CustomerSummaryFilters,
  CustomerSummaryItem,
  CustomerPurchaseFilters,
  CustomerPurchaseItem,
  TopCustomerItem,
  TopCustomersFilters,
} from './repository/customer-report.repository.js';
import type { ReportPaginatedResponse } from '../../../../shared/types/report-filter.js';

export class CustomerSummaryReportDefinition implements ReportDefinition<
  CustomerSummaryFilters,
  ReportPaginatedResponse<CustomerSummaryItem>
> {
  name = 'customers';
  title = 'Customer Summary Report';
  columns: ReportColumn[] = [
    { key: 'customerId', label: 'Customer ID' },
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'totalSpent', label: 'Total Spent' },
    { key: 'averageSale', label: 'Average Sale' },
    { key: 'lastPurchase', label: 'Last Purchase' },
  ];

  constructor(private readonly _repository: ICustomerReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(
    filters: CustomerSummaryFilters,
  ): Promise<ReportPaginatedResponse<CustomerSummaryItem>> {
    return this._repository.getCustomerSummary(filters);
  }
}

export class CustomerPurchasesReportDefinition implements ReportDefinition<
  CustomerPurchaseFilters,
  ReportPaginatedResponse<CustomerPurchaseItem>
> {
  name = 'customer-purchases';
  title = 'Customer Purchase History';
  columns: ReportColumn[] = [
    { key: 'invoiceNumber', label: 'Invoice' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'cashier', label: 'Cashier' },
  ];

  constructor(private readonly _repository: ICustomerReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(
    filters: CustomerPurchaseFilters,
  ): Promise<ReportPaginatedResponse<CustomerPurchaseItem>> {
    return this._repository.getCustomerPurchases(filters);
  }
}

export class TopCustomersReportDefinition implements ReportDefinition<
  TopCustomersFilters,
  TopCustomerItem[]
> {
  name = 'top-customers';
  title = 'Top Customers Report';
  columns: ReportColumn[] = [
    { key: 'customerId', label: 'Customer ID' },
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'totalSpent', label: 'Total Spent' },
    { key: 'transactions', label: 'Transactions' },
  ];

  constructor(private readonly _repository: ICustomerReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(filters: TopCustomersFilters): Promise<TopCustomerItem[]> {
    return this._repository.getTopCustomers(filters);
  }
}

export function registerCustomerReports(repository: ICustomerReportRepository) {
  reportRegistry.register(new CustomerSummaryReportDefinition(repository));
  reportRegistry.register(new CustomerPurchasesReportDefinition(repository));
  reportRegistry.register(new TopCustomersReportDefinition(repository));
}
