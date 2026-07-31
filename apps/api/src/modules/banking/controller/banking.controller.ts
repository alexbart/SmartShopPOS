import type { FastifyRequest, FastifyReply } from 'fastify';
import type { BankingService } from '../service/banking.service.js';

export class BankingController {
  constructor(private readonly _bankingService: BankingService) {}

  async listAccounts(request: FastifyRequest, reply: FastifyReply) {
    const accounts = await this._bankingService.listBankAccounts(request.requestContext.organizationId);
    return reply.status(200).send({
      success: true,
      message: 'Bank accounts retrieved.',
      data: accounts,
    });
  }

  async createAccount(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { bankName: string; accountNumber: string; accountType: 'CHECKING' | 'SAVINGS' };

    const account = await this._bankingService.createBankAccount({
      organizationId: request.requestContext.organizationId,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      accountType: body.accountType,
    });

    return reply.status(201).send({
      success: true,
      message: 'Bank account created successfully.',
      data: account,
    });
  }

  async deposit(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { cashDrawerSessionId: string; bankAccountId: string; amount: number };

    const deposit = await this._bankingService.createDeposit({
      organizationId: request.requestContext.organizationId,
      cashDrawerSessionId: body.cashDrawerSessionId,
      bankAccountId: body.bankAccountId,
      amount: body.amount,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Deposit recorded successfully.',
      data: deposit,
    });
  }
}
