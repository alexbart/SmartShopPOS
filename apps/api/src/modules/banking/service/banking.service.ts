import type { BankingRepositoryImpl, CreateBankAccountCommand, CreateDepositCommand } from '../repository/banking.repository.js';

export class BankingService {
  constructor(private readonly _repository: BankingRepositoryImpl) {}

  async createBankAccount(command: CreateBankAccountCommand) {
    return this._repository.createBankAccount(command);
  }

  async listBankAccounts(organizationId: string) {
    return this._repository.listBankAccounts(organizationId);
  }

  async getBankAccount(id: string, organizationId: string) {
    return this._repository.findBankAccountById(id, organizationId);
  }

  async createDeposit(command: CreateDepositCommand) {
    if (command.amount <= 0) {
      throw new Error('Deposit amount must be greater than zero.');
    }
    return this._repository.createDeposit(command);
  }
}
