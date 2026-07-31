import type {
  ISalesReportRepository,
  SalesReportFilters,
  SalesReportResponse,
} from '../repository/sales-report.repository.js';

export class SalesReportService {
  constructor(private readonly _repository: ISalesReportRepository) {}

  async getSalesReport(filters: SalesReportFilters): Promise<SalesReportResponse> {
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
