import { reportRegistry, type ReportDefinition, type ReportColumn, type ReportPaginatedResponse } from '../../../shared/report-registry.js';
import type { FinanceReportRepositoryImpl } from '../repository/finance-report.repository.impl.js';
import type { FinanceReportFilters } from '../repository/finance-report.repository.js';
import type { DailyCashSummaryRow, ExpenseReportRow, ProfitSummaryRow, CashDrawerVarianceRow, SalesByPaymentMethodRow } from '../repository/finance-report.repository.js';

export class DailyCashSummaryReportDefinition
  implements ReportDefinition<FinanceReportFilters, ReportPaginatedResponse<DailyCashSummaryRow>>
{
  name = 'daily-cash-summary';
  title = 'Daily Cash Summary';
  columns: ReportColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'openingFloat', label: 'Opening Float' },
    { key: 'cashSales', label: 'Cash Sales' },
    { key: 'cardSales', label: 'Card Sales' },
    { key: 'cashRefunds', label: 'Cash Refunds' },
    { key: 'cashIn', label: 'Cash In' },
    { key: 'cashOut', label: 'Cash Out' },
    { key: 'expectedCash', label: 'Expected Cash' },
    { key: 'closingFloat', label: 'Closing Float' },
    { key: 'variance', label: 'Variance' },
  ];

  constructor(private readonly _repository: FinanceReportRepositoryImpl) {}

  // eslint-disable-next-line no-unused-vars
  async execute(filters: FinanceReportFilters): Promise<ReportPaginatedResponse<DailyCashSummaryRow>> {
    const data = await this._repository.dailyCashSummary(filters);
    return { data, total: data.length };
  }
}

export class ExpenseReportDefinition
  implements ReportDefinition<FinanceReportFilters, ReportPaginatedResponse<ExpenseReportRow>>
{
  name = 'expense-report';
  title = 'Expense Report';
  columns: ReportColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'categoryName', label: 'Category' },
    { key: 'amount', label: 'Amount' },
    { key: 'description', label: 'Description' },
    { key: 'paymentReference', label: 'Payment Ref' },
  ];

  constructor(private readonly _repository: FinanceReportRepositoryImpl) {}

  // eslint-disable-next-line no-unused-vars
  async execute(filters: FinanceReportFilters): Promise<ReportPaginatedResponse<ExpenseReportRow>> {
    const data = await this._repository.expenseReport(filters);
    return { data, total: data.length };
  }
}

export class ProfitSummaryReportDefinition
  implements ReportDefinition<FinanceReportFilters, ReportPaginatedResponse<ProfitSummaryRow>>
{
  name = 'profit-summary';
  title = 'Profit Summary';
  columns: ReportColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'costOfGoodsSold', label: 'COGS' },
    { key: 'grossProfit', label: 'Gross Profit' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'netProfit', label: 'Net Profit' },
  ];

  constructor(private readonly _repository: FinanceReportRepositoryImpl) {}

  // eslint-disable-next-line no-unused-vars
  async execute(filters: FinanceReportFilters): Promise<ReportPaginatedResponse<ProfitSummaryRow>> {
    const data = await this._repository.profitSummary(filters);
    return { data, total: data.length };
  }
}

export class CashDrawerVarianceReportDefinition
  implements ReportDefinition<FinanceReportFilters, ReportPaginatedResponse<CashDrawerVarianceRow>>
{
  name = 'cash-drawer-variance';
  title = 'Cash Drawer Variance';
  columns: ReportColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'openingFloat', label: 'Opening Float' },
    { key: 'expectedCash', label: 'Expected Cash' },
    { key: 'countedCash', label: 'Counted Cash' },
    { key: 'variance', label: 'Variance' },
  ];

  constructor(private readonly _repository: FinanceReportRepositoryImpl) {}

  // eslint-disable-next-line no-unused-vars
  async execute(filters: FinanceReportFilters): Promise<ReportPaginatedResponse<CashDrawerVarianceRow>> {
    const data = await this._repository.cashDrawerVariance(filters);
    return { data, total: data.length };
  }
}

export class SalesByPaymentMethodReportDefinition
  implements ReportDefinition<FinanceReportFilters, ReportPaginatedResponse<SalesByPaymentMethodRow>>
{
  name = 'sales-by-payment-method';
  title = 'Sales by Payment Method';
  columns: ReportColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'amount', label: 'Amount' },
    { key: 'count', label: 'Count' },
  ];

  constructor(private readonly _repository: FinanceReportRepositoryImpl) {}

  // eslint-disable-next-line no-unused-vars
  async execute(filters: FinanceReportFilters): Promise<ReportPaginatedResponse<SalesByPaymentMethodRow>> {
    const data = await this._repository.salesByPaymentMethod(filters);
    return { data, total: data.length };
  }
}

export function registerFinanceReports(repository: FinanceReportRepositoryImpl) {
  reportRegistry.register(new DailyCashSummaryReportDefinition(repository));
  reportRegistry.register(new ExpenseReportDefinition(repository));
  reportRegistry.register(new ProfitSummaryReportDefinition(repository));
  reportRegistry.register(new CashDrawerVarianceReportDefinition(repository));
  reportRegistry.register(new SalesByPaymentMethodReportDefinition(repository));
}
