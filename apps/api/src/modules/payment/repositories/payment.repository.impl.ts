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
  darajaRequestId: true,
  darajaTransactionId: true,
} as const;

function mapPayment(p: {
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
  darajaRequestId: string | null;
  darajaTransactionId: string | null;
}) {
  return {
    id: p.id,
    organizationId: p.organizationId,
    saleId: p.saleId,
    method: p.method,
    amount: Number(p.amount),
    reference: p.reference ?? undefined,
    status: p.status,
    paidAt: p.paidAt ?? undefined,
    createdAt: p.createdAt,
    idempotencyKey: p.idempotencyKey ?? undefined,
    darajaRequestId: p.darajaRequestId ?? undefined,
    darajaTransactionId: p.darajaTransactionId ?? undefined,
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
        darajaRequestId: _model.darajaRequestId,
      },
      select: { id: true },
    });
    return payment.id;
  }

  async findById(_id: string, _organizationId: string) {
    const p = await this._prisma.payment.findFirst({
      where: { id: _id, organizationId: _organizationId },
      select: PAYMENT_SELECT,
    });
    return p ? mapPayment(p) : null;
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
    const p = await this._prisma.payment.findUnique({
      where: { idempotencyKey: _key },
      select: PAYMENT_SELECT,
    });
    return p ? mapPayment(p) : null;
  }

  async findByDarajaRequestId(_requestId: string) {
    const p = await this._prisma.payment.findUnique({
      where: { darajaRequestId: _requestId },
      select: PAYMENT_SELECT,
    });
    return p ? mapPayment(p) : null;
  }

  async getTotalPaidForSale(_saleId: string, _organizationId: string) {
    const result = await this._prisma.payment.aggregate({
      where: { saleId: _saleId, organizationId: _organizationId, status: 'PAID' },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  async hasPendingMpesa(_saleId: string, _organizationId: string) {
    const count = await this._prisma.payment.count({
      where: {
        saleId: _saleId,
        organizationId: _organizationId,
        method: 'MPESA',
        status: 'PENDING',
      },
    });
    return count > 0;
  }

  async updateStatus(
    _id: string,
    _status: string,
    _opts?: { paidAt?: Date; darajaTransactionId?: string },
  ) {
    await this._prisma.payment.update({
      where: { id: _id },
      data: {
        status: _status as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
        paidAt: _opts?.paidAt,
        darajaTransactionId: _opts?.darajaTransactionId,
      },
    });
  }
}
