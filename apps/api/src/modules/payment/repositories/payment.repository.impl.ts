import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { IPaymentRepository } from './payment.repository.js';

const PAYMENT_SELECT = {
  id: true,
  organizationId: true,
  saleId: true,
  method: true,
  amount: true,
  reference: true,
  status: true,
  paidAt: true,
  createdAt: true,
  idempotencyKey: true,
} as const;

function mapPayment(payment: {
  id: string;
  organizationId: string;
  saleId: string;
  method: string;
  amount: { toNumber(): number } | number;
  reference: string | null;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  idempotencyKey: string | null;
}) {
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
    idempotencyKey: payment.idempotencyKey ?? undefined,
  };
}

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
        idempotencyKey: _model.idempotencyKey,
      },
      select: { id: true },
    });

    return payment.id;
  }

  async findById(_id: string, _organizationId: string) {
    const payment = await this._prisma.payment.findFirst({
      where: { id: _id, organizationId: _organizationId },
      select: PAYMENT_SELECT,
    });

    return payment ? mapPayment(payment) : null;
  }

  async findBySaleId(_saleId: string, _organizationId: string) {
    const payments = await this._prisma.payment.findMany({
      where: { saleId: _saleId, organizationId: _organizationId },
      select: PAYMENT_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    return payments.map(mapPayment);
  }

  async findByIdempotencyKey(_key: string) {
    const payment = await this._prisma.payment.findUnique({
      where: { idempotencyKey: _key },
      select: PAYMENT_SELECT,
    });

    return payment ? mapPayment(payment) : null;
  }

  async getTotalPaidForSale(_saleId: string, _organizationId: string) {
    const result = await this._prisma.payment.aggregate({
      where: { saleId: _saleId, organizationId: _organizationId, status: 'PAID' },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }
}
