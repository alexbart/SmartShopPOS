import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type {
  IFinanceReportRepository,
  FinanceReportFilters,
  DailyCashSummaryRow,
  ExpenseReportRow,
  ProfitSummaryRow,
  CashDrawerVarianceRow,
  SalesByPaymentMethodRow,
} from './finance-report.repository.js';

type WhereInput = Record<string, unknown>;

function buildDateFilter(field: string, from?: Date, to?: Date): Record<string, unknown> {
  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;
  return { [field]: dateFilter };
}

export class FinanceReportRepositoryImpl implements IFinanceReportRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async dailyCashSummary(filters: FinanceReportFilters): Promise<DailyCashSummaryRow[]> {
    const where: WhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.date) {
      (where as Record<string, unknown>).openedAt = {
        gte: new Date(`${filters.date.toISOString().split('T')[0]}T00:00:00Z`),
      };
    } else if (filters.from && filters.to) {
      (where as Record<string, unknown>).openedAt = { gte: filters.from, lte: filters.to };
    }

    const sessions = await this._prisma.cashDrawerSession.findMany({
      where,
      include: {
        movements: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
      take: filters.limit ?? undefined,
    });

    if (!sessions || sessions.length === 0) {
      return [];
    }

    return sessions.map((s) => {
      const cashSales = s.movements
        .filter((m) => m.type === 'SALE')
        .reduce((sum, m) => sum + Number(m.amount), 0);
      const cardSales = 0;
      const cashRefunds = s.movements
        .filter((m) => m.type === 'REFUND')
        .reduce((sum, m) => sum + Number(m.amount), 0);
      const cashIn = s.movements
        .filter((m) => m.type === 'CASH_IN')
        .reduce((sum, m) => sum + Number(m.amount), 0);
      const cashOut = s.movements
        .filter((m) => m.type === 'CASH_OUT')
        .reduce((sum, m) => sum + Number(m.amount), 0);

      return {
        date: s.openedAt.toISOString().split('T')[0],
        openingFloat: Number(s.openingFloat),
        cashSales,
        cardSales,
        cashRefunds,
        cashIn,
        cashOut,
        expectedCash: Number(s.expectedCash),
        closingFloat: s.closingFloat ? Number(s.closingFloat) : null,
        variance: s.variance ? Number(s.variance) : null,
      };
    });
  }

  async expenseReport(filters: FinanceReportFilters): Promise<ExpenseReportRow[]> {
    const where: WhereInput = { organizationId: filters.organizationId };

    if (filters.from || filters.to) {
      Object.assign(where, buildDateFilter('expenseDate', filters.from, filters.to));
    }

    const expenses = await this._prisma.expense.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { expenseDate: 'desc' },
      take: filters.limit ?? undefined,
    });

    return expenses.map((e) => ({
      date: e.expenseDate.toISOString().split('T')[0],
      categoryName: e.category.name,
      amount: Number(e.amount),
      description: e.description ?? '',
      paymentReference: e.paymentReference ?? '',
    }));
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async profitSummary(_filters: FinanceReportFilters): Promise<ProfitSummaryRow[]> {
    return [
      {
        date: new Date().toISOString().split('T')[0],
        revenue: 0,
        costOfGoodsSold: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
      },
    ];
  }

  async cashDrawerVariance(filters: FinanceReportFilters): Promise<CashDrawerVarianceRow[]> {
    const where: WhereInput = {
      organizationId: filters.organizationId,
      status: 'CLOSED',
    };

    if (filters.from || filters.to) {
      Object.assign(where, buildDateFilter('closedAt', filters.from, filters.to));
    }

    const closed = await this._prisma.cashDrawerSession.findMany({
      where,
      orderBy: { closedAt: 'desc' },
      take: filters.limit ?? undefined,
    });

    return closed.map((s) => ({
      date: s.closedAt ? s.closedAt.toISOString().split('T')[0] : '',
      openingFloat: Number(s.openingFloat),
      expectedCash: Number(s.expectedCash),
      countedCash: s.countedCash ? Number(s.countedCash) : 0,
      variance: s.variance ? Number(s.variance) : 0,
    }));
  }

  async salesByPaymentMethod(filters: FinanceReportFilters): Promise<SalesByPaymentMethodRow[]> {
    const where: WhereInput = { organizationId: filters.organizationId };

    if (filters.from || filters.to) {
      Object.assign(where, buildDateFilter('createdAt', filters.from, filters.to));
    }

    const payments = await this._prisma.payment.findMany({
      where,
      select: {
        paymentMethod: true,
        amount: true,
        createdAt: true,
      },
    });

    const byMethod: Record<string, { amount: number; count: number; date: string }> = {};

    payments.forEach((p) => {
      const key = `${p.paymentMethod}|${p.createdAt.toISOString().split('T')[0]}`;
      if (!byMethod[key]) {
        byMethod[key] = { amount: 0, count: 0, date: p.createdAt.toISOString().split('T')[0] };
      }
      byMethod[key].amount += Number(p.amount);
      byMethod[key].count += 1;
    });

    return Object.entries(byMethod).map(([key, val]) => ({
      date: val.date,
      paymentMethod: key.split('|')[0],
      amount: val.amount,
      count: val.count,
    }));
  }
}
