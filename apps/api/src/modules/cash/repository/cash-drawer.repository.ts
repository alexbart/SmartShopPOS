export interface CashDrawerFilters {
  organizationId: string;
}

export interface CashDrawerSummary {
  drawerId: string;
  name: string;
  session: {
    id: string;
    status: 'OPEN' | 'CLOSED';
    openingFloat: number;
    closingFloat: number | null;
    totalSales: number;
    totalRefunds: number;
    totalCashIn: number;
    totalCashOut: number;
    expectedCash: number;
    countedCash: number | null;
    variance: number | null;
    openedAt: Date;
    closedAt: Date | null;
    movements: CashMovementItem[];
  } | null;
}

export interface CashMovementItem {
  id: string;
  type: string;
  amount: number;
  referenceType?: string;
  notes?: string;
  performedBy?: string;
  createdAt: Date;
}

export interface ICashDrawerRepository {
  // eslint-disable-next-line no-unused-vars
  getCurrentSession(organizationId: string, branchId: string): Promise<CashDrawerSummary | null>;
  // eslint-disable-next-line no-unused-vars
  openSession(organizationId: string, branchId: string, userId: string, openingFloat: number): Promise<CashDrawerSummary>;
  // eslint-disable-next-line no-unused-vars
  closeSession(sessionId: string, countedCash: number): Promise<CashDrawerSummary>;
  // eslint-disable-next-line no-unused-vars
  addCashIn(sessionId: string, amount: number, notes?: string, performedBy?: string): Promise<void>;
  // eslint-disable-next-line no-unused-vars
  addCashOut(sessionId: string, amount: number, notes?: string, performedBy?: string): Promise<void>;
  // eslint-disable-next-line no-unused-vars
  getMovements(organizationId: string, sessionId: string): Promise<CashMovementItem[]>;
}
