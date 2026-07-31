import type { ICashDrawerRepository, CashDrawerSummary } from '../repository/cash-drawer.repository.js';

export class CashDrawerService {
  constructor(private readonly _repository: ICashDrawerRepository) {}

  async getCurrentSession(branchId: string, organizationId: string): Promise<CashDrawerSummary | null> {
    return this._repository.getCurrentSession(organizationId, branchId);
  }

  async openSession(
    branchId: string,
    organizationId: string,
    userId: string,
    openingFloat: number,
  ): Promise<CashDrawerSummary> {
    if (openingFloat <= 0) {
      throw new Error('Opening float must be greater than zero.');
    }
    return this._repository.openSession(organizationId, branchId, userId, openingFloat);
  }

  async closeSession(sessionId: string, countedCash: number): Promise<CashDrawerSummary> {
    if (countedCash < 0) {
      throw new Error('Counted cash cannot be negative.');
    }
    return this._repository.closeSession(sessionId, countedCash);
  }

  async cashIn(sessionId: string, amount: number, notes?: string, performedBy?: string): Promise<void> {
    if (amount <= 0) {
      throw new Error('Cash in amount must be greater than zero.');
    }
    await this._repository.addCashIn(sessionId, amount, notes, performedBy);
  }

  async cashOut(sessionId: string, amount: number, notes?: string, performedBy?: string): Promise<void> {
    if (amount <= 0) {
      throw new Error('Cash out amount must be greater than zero.');
    }
    await this._repository.addCashOut(sessionId, amount, notes, performedBy);
  }

  async getMovements(sessionId: string, organizationId: string) {
    return this._repository.getMovements(organizationId, sessionId);
  }
}
