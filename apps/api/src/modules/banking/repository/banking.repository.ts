import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../../shared/errors/business-error.js';

export interface BankAccountEntity {
  id: string;
  organizationId: string;
  bankName: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBankAccountCommand {
  organizationId: string;
  bankName: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
}

export interface DepositEntity {
  id: string;
  organizationId: string;
  fromCashDrawerSessionId: string;
  toAccountId: string;
  amount: number;
  referenceNumber: string;
  depositedAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepositCommand {
  organizationId: string;
  cashDrawerSessionId: string;
  bankAccountId: string;
  amount: number;
  createdBy: string;
}

export interface IBankingRepository {
  // eslint-disable-next-line no-unused-vars
  createBankAccount(command: CreateBankAccountCommand): Promise<BankAccountEntity>;
  // eslint-disable-next-line no-unused-vars
  findBankAccountById(id: string, organizationId: string): Promise<BankAccountEntity | null>;
  // eslint-disable-next-line no-unused-vars
  listBankAccounts(organizationId: string): Promise<BankAccountEntity[]>;
  // eslint-disable-next-line no-unused-vars
  createDeposit(command: CreateDepositCommand): Promise<DepositEntity>;
}

export class BankingRepositoryImpl implements IBankingRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async createBankAccount(command: CreateBankAccountCommand): Promise<BankAccountEntity> {
    const result = await this._prisma.bankAccount.create({
      data: {
        organizationId: command.organizationId,
        bankName: command.bankName,
        accountNumber: command.accountNumber,
        accountType: command.accountType,
        balance: 0,
      },
    });

    return this._toAccountEntity(result);
  }

  async findBankAccountById(id: string, organizationId: string): Promise<BankAccountEntity | null> {
    const account = await this._prisma.bankAccount.findFirst({
      where: { id, organizationId },
    });

    if (!account) return null;
    return this._toAccountEntity(account);
  }

  async listBankAccounts(organizationId: string): Promise<BankAccountEntity[]> {
    const accounts = await this._prisma.bankAccount.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((a) => this._toAccountEntity(a));
  }

  async createDeposit(command: CreateDepositCommand): Promise<DepositEntity> {
    return this._prisma.$transaction(async (tx) => {
      const session = await tx.cashDrawerSession.findFirst({
        where: { id: command.cashDrawerSessionId, status: 'OPEN' },
      });

      if (!session) {
        throw new NotFoundError('Open cash drawer session not found.');
      }

      if (Number(session.expectedCash) < command.amount) {
        throw new ConflictError('Deposit amount cannot exceed available cash in drawer.');
      }

      const referenceNumber = `DEP-${Date.now()}`;

      const deposit = await tx.deposit.create({
        data: {
          organizationId: command.organizationId,
          fromCashDrawerSessionId: command.cashDrawerSessionId,
          toAccountId: command.bankAccountId,
          amount: command.amount,
          referenceNumber,
          createdBy: command.createdBy,
        },
      });

      await tx.bankAccount.update({
        where: { id: command.bankAccountId },
        data: { balance: { increment: command.amount } },
      });

      await tx.cashDrawerSession.update({
        where: { id: command.cashDrawerSessionId },
        data: {
          expectedCash: { decrement: command.amount },
        },
      });

      await tx.cashMovement.create({
        data: {
          organizationId: command.organizationId,
          sessionId: command.cashDrawerSessionId,
          type: 'CASH_OUT',
          amount: command.amount,
          referenceType: 'DEPOSIT',
          referenceId: deposit.id,
          performedBy: command.createdBy,
          notes: `Bank deposit ${referenceNumber}`,
        },
      });

      return {
        id: deposit.id,
        organizationId: deposit.organizationId,
        fromCashDrawerSessionId: deposit.fromCashDrawerSessionId,
        toAccountId: deposit.toAccountId,
        amount: Number(deposit.amount),
        referenceNumber: deposit.referenceNumber,
        depositedAt: deposit.depositedAt,
        createdBy: deposit.createdBy,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt,
      };
    });
  }

  private _toAccountEntity(account: {
    id: string;
    organizationId: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
    balance: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BankAccountEntity {
    return {
      id: account.id,
      organizationId: account.organizationId,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountType: account.accountType as 'CHECKING' | 'SAVINGS',
      balance: Number(account.balance),
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
