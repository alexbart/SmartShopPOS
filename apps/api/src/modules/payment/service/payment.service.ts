import type { PrismaClient } from '@prisma/client';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { PaymentRepositoryImpl } from '../repositories/payment.repository.impl.js';
import type { CreatePaymentCommand } from '../commands/create-payment.command.js';
import type { PaymentResponse } from '../responses/payment.response.js';
import { PaymentStatuses } from '../../../shared/constants/domain-constants.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../shared/errors/business-error.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import { PaymentReceivedEvent } from '../../../shared/events/domain-events.js';

export class PaymentService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _prisma: PrismaClient,
    private readonly _eventBus: EventBus,
  ) {}

  async create(command: CreatePaymentCommand): Promise<PaymentResponse> {
    // Validate amount before touching the database
    if (
      !Number.isFinite(command.amount) ||
      isNaN(command.amount) ||
      command.amount <= 0
    ) {
      throw new ValidationError('Payment amount must be a positive finite number.');
    }

    return this._unitOfWork.execute(async (tx) => {
      const paymentRepo = new PaymentRepositoryImpl(tx);

      // Idempotency: return existing payment if key already used
      if (command.idempotencyKey) {
        const existing = await paymentRepo.findByIdempotencyKey(command.idempotencyKey);
        if (existing) {
          // Verify the existing payment belongs to this org (safety check)
          if (existing.organizationId !== command.organizationId) {
            throw new ConflictError('Idempotency key conflict.');
          }
          return this._toResponse(existing);
        }
      }

      // Verify sale exists and belongs to this organization
      const sale = await tx.sale.findFirst({
        where: { id: command.saleId, organizationId: command.organizationId },
        select: { total: true },
      });

      if (!sale) {
        throw new NotFoundError('Sale not found.');
      }

      const saleTotal = Number(sale.total);

      // Overpayment guard — scoped to org to prevent cross-org leakage
      const totalPaid = await paymentRepo.getTotalPaidForSale(
        command.saleId,
        command.organizationId,
      );

      if (totalPaid + command.amount > saleTotal) {
        throw new ConflictError(
          `Payment would exceed sale total. Already paid: ${totalPaid}, sale total: ${saleTotal}.`,
        );
      }

      // Create payment — DB unique constraint on idempotencyKey handles race conditions
      let paymentId: string;
      try {
        paymentId = await paymentRepo.create({
          organizationId: command.organizationId,
          saleId: command.saleId,
          method: command.method,
          amount: command.amount,
          reference: command.reference,
          status: PaymentStatuses.PAID,
          paidAt: new Date(),
          idempotencyKey: command.idempotencyKey,
        });
      } catch (err: unknown) {
        // Unique constraint violation on idempotencyKey = concurrent duplicate request
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('idempotencyKey') || msg.includes('Unique constraint')) {
          // Re-fetch and return the winner
          if (command.idempotencyKey) {
            const winner = await paymentRepo.findByIdempotencyKey(command.idempotencyKey);
            if (winner) return this._toResponse(winner);
          }
          throw new ConflictError('Duplicate payment request.');
        }
        throw err;
      }

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

      return this._toResponse(payment);
    });
  }

  async findBySaleId(saleId: string, organizationId: string): Promise<PaymentResponse[]> {
    const paymentRepo = new PaymentRepositoryImpl(this._prisma);
    const payments = await paymentRepo.findBySaleId(saleId, organizationId);
    return payments.map((p) => this._toResponse(p));
  }

  private _toResponse(payment: {
    id: string;
    organizationId: string;
    saleId: string;
    method: string;
    amount: number;
    reference?: string;
    status: string;
    paidAt?: Date;
    createdAt: Date;
    idempotencyKey?: string;
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
      idempotencyKey: payment.idempotencyKey,
    };
  }
}
