export interface FinanceReportFilters {
  organizationId: string;
  date?: Date;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface DailyCashSummaryRow {
  date: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  cashRefunds: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  closingFloat: number | null;
  variance: number | null;
}

export interface ExpenseReportRow {
  date: string;
  categoryName: string;
  amount: number;
  description: string;
  paymentReference: string;
}

export interface ProfitSummaryRow {
  date: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface CashDrawerVarianceRow {
  date: string;
  openingFloat: number;
  expectedCash: number;
  countedCash: number;
  variance: number;
}

export interface SalesByPaymentMethodRow {
  date: string;
  paymentMethod: string;
  amount: number;
  count: number;
}

export interface IFinanceReportRepository {
  // eslint-disable-next-line no-unused-vars
  dailyCashSummary(filters: FinanceReportFilters): Promise<DailyCashSummaryRow[]>;
  // eslint-disable-next-line no-unused-vars
  expenseReport(filters: FinanceReportFilters): Promise<ExpenseReportRow[]>;
  // eslint-disable-next-line no-unused-vars
  profitSummary(filters: FinanceReportFilters): Promise<ProfitSummaryRow[]>;
  // eslint-disable-next-line no-unused-vars
  cashDrawerVariance(filters: FinanceReportFilters): Promise<CashDrawerVarianceRow[]>;
  // eslint-disable-next-line no-unused-vars
  salesByPaymentMethod(filters: FinanceReportFilters): Promise<SalesByPaymentMethodRow[]>;
}
