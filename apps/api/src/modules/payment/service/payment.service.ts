import type { PrismaClient } from '@prisma/client';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { PaymentRepositoryImpl } from '../repositories/payment.repository.impl.js';
import type { CreatePaymentCommand } from '../commands/create-payment.command.js';
import type { PaymentResponse } from '../responses/payment.response.js';

export class PaymentService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _prisma: PrismaClient,
  ) {}

  async create(command: CreatePaymentCommand): Promise<PaymentResponse> {
    return this._unitOfWork.execute(async (tx) => {
      const paymentRepo = new PaymentRepositoryImpl(tx);

      const totalPaid = await paymentRepo.getTotalForSale(command.saleId);
      if (totalPaid + command.amount > 0) {
        const sale = await tx.sale.findFirst({
          where: { id: command.saleId, organizationId: command.organizationId },
          select: { total: true },
        });
        if (!sale) {
          throw new Error('Sale not found.') as Error & { code: string; statusCode: number };
        }
        if (totalPaid + command.amount > Number(sale.total)) {
          throw new Error('Payment amount exceeds sale total.') as Error & {
            code: string;
            statusCode: number;
          };
        }
      }

      const paymentId = await paymentRepo.create({
        organizationId: command.organizationId,
        saleId: command.saleId,
        method: command.method,
        amount: command.amount,
        reference: command.reference,
        status: 'PAID',
        paidAt: new Date(),
      });

      const payment = await paymentRepo.findById(paymentId, command.organizationId);
      if (!payment) {
        throw new Error('Payment not found after creation.') as Error & {
          code: string;
          statusCode: number;
        };
      }

      return this.toResponse(payment);
    });
  }

  async findBySaleId(saleId: string, organizationId: string): Promise<PaymentResponse[]> {
    const paymentRepo = new PaymentRepositoryImpl(this._prisma);
    const payments = await paymentRepo.findBySaleId(saleId, organizationId);
    return payments.map((p) => this.toResponse(p));
  }

  private toResponse(payment: {
    id: string;
    organizationId: string;
    saleId: string;
    method: string;
    amount: number;
    reference?: string;
    status: string;
    paidAt?: Date;
    createdAt: Date;
  }): PaymentResponse {
    return {
      id: payment.id,
      organizationId: payment.organizationId,
      saleId: payment.saleId,
      method: payment.method,
      amount: Number(payment.amount),
      reference: payment.reference,
      status: payment.status,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }
}
