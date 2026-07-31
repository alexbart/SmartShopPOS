import type { PrismaClient } from '@prisma/client';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { PaymentRepositoryImpl } from '../repositories/payment.repository.impl.js';
import type { CreatePaymentCommand } from '../commands/create-payment.command.js';
import type { PaymentResponse } from '../responses/payment.response.js';
import { PaymentStatuses } from '../../../shared/constants/domain-constants.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/business-error.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import { PaymentReceivedEvent } from '../../../shared/events/domain-events.js';

export class PaymentService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _prisma: PrismaClient,
    private readonly _eventBus: EventBus,
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
          throw new NotFoundError('Sale not found.');
        }
        if (totalPaid + command.amount > Number(sale.total)) {
          throw new ConflictError('Payment amount exceeds sale total.');
        }
      }

      const paymentId = await paymentRepo.create({
        organizationId: command.organizationId,
        saleId: command.saleId,
        method: command.method,
        amount: command.amount,
        reference: command.reference,
        status: PaymentStatuses.PAID,
        paidAt: new Date(),
      });

      const payment = await paymentRepo.findById(paymentId, command.organizationId);
      if (!payment) {
        throw new NotFoundError('Payment not found after creation.');
      }

      await this._eventBus.publish(
        new PaymentReceivedEvent(
          paymentId,
          command.saleId,
          command.organizationId,
          command.amount,
          command.method,
        ),
      );

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
