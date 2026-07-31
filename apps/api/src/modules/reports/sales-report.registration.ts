import { reportRegistry } from '../../shared/report-registry.js';
import type { ReportDefinition } from '../../shared/report-registry.js';
import type {
  SalesReportFilters,
  SalesReportResponse,
} from './repository/sales-report.repository.js';
import type { ISalesReportRepository } from './repository/sales-report.repository.js';

export class SalesReportDefinition implements ReportDefinition<
  SalesReportFilters,
  SalesReportResponse
> {
  name = 'sales';
  title = 'Sales Report';
  columns = [
    { key: 'saleNumber', label: 'Invoice' },
    { key: 'customer', label: 'Customer' },
    { key: 'cashier', label: 'Cashier' },
    { key: 'total', label: 'Amount' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'createdAt', label: 'Date' },
  ];

  constructor(private readonly _repository: ISalesReportRepository) {}

  async execute(filters: SalesReportFilters): Promise<SalesReportResponse> {
    const [reportData, summary, payments] = await Promise.all([
      this._repository.getSalesReport(filters),
      this._repository.getSalesSummary(filters),
      this._repository.getPaymentBreakdown(filters),
    ]);

    const totalPages = Math.ceil(reportData.total / filters.limit) || 0;

    return {
      summary,
      payments,
      items: reportData.items,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: reportData.total,
        totalPages,
      },
    };
  }
}

export function registerSalesReport(repository: ISalesReportRepository) {
  const definition = new SalesReportDefinition(repository);
  reportRegistry.register(definition);
}
