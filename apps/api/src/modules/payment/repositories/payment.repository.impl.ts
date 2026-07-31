import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { IPaymentRepository } from './payment.repository.js';

export class PaymentRepositoryImpl implements IPaymentRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(_model: Parameters<IPaymentRepository['create']>[0]) {
    const payment = await this._prisma.payment.create({
      data: {
        organizationId: _model.organizationId,
        saleId: _model.saleId,
        method: _model.method as 'CASH' | 'MPESA' | 'CARD' | 'BANK' | 'CREDIT',
        amount: _model.amount,
        reference: _model.reference,
        status: _model.status as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
        paidAt: _model.paidAt,
      },
      select: { id: true },
    });

    return payment.id;
  }

  async findById(_id: string, _organizationId: string) {
    const payment = await this._prisma.payment.findFirst({
      where: { id: _id, organizationId: _organizationId },
      select: {
        id: true,
        organizationId: true,
        saleId: true,
        method: true,
        amount: true,
        reference: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    });

    if (!payment) return null;

    return {
      id: payment.id,
      organizationId: payment.organizationId,
      saleId: payment.saleId,
      method: payment.method,
      amount: Number(payment.amount),
      reference: payment.reference ?? undefined,
      status: payment.status,
      paidAt: payment.paidAt ?? undefined,
      createdAt: payment.createdAt,
    };
  }

  async findBySaleId(_saleId: string, _organizationId: string) {
    const payments = await this._prisma.payment.findMany({
      where: { saleId: _saleId, organizationId: _organizationId },
      select: {
        id: true,
        organizationId: true,
        saleId: true,
        method: true,
        amount: true,
        reference: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      organizationId: payment.organizationId,
      saleId: payment.saleId,
      method: payment.method,
      amount: Number(payment.amount),
      reference: payment.reference ?? undefined,
      status: payment.status,
      paidAt: payment.paidAt ?? undefined,
      createdAt: payment.createdAt,
    }));
  }

  async getTotalForSale(_saleId: string) {
    const result = await this._prisma.payment.aggregate({
      where: { saleId: _saleId, status: 'PAID' },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }
}
