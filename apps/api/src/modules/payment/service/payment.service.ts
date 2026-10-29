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
import { initiateStkPush } from '../../../shared/services/daraja/stk-push.service.js';

export class PaymentService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _prisma: PrismaClient,
    private readonly _eventBus: EventBus,
  ) {}

  async create(command: CreatePaymentCommand): Promise<PaymentResponse> {
    if (!Number.isFinite(command.amount) || isNaN(command.amount) || command.amount <= 0) {
      throw new ValidationError('Payment amount must be a positive finite number.');
    }

    if (command.method === 'MPESA') {
      return this._createMpesaPayment(command);
    }

    return this._unitOfWork.execute(async (tx) => {
      const paymentRepo = new PaymentRepositoryImpl(tx);

      if (command.idempotencyKey) {
        const existing = await paymentRepo.findByIdempotencyKey(command.idempotencyKey);
        if (existing) {
          if (existing.organizationId !== command.organizationId) {
            throw new ConflictError('Idempotency key conflict.');
          }
          return this._toResponse(existing);
        }
      }

      const sale = await tx.sale.findFirst({
        where: { id: command.saleId, organizationId: command.organizationId },
        select: { total: true },
      });
      if (!sale) throw new NotFoundError('Sale not found.');

      const saleTotal = Number(sale.total);
      const totalPaid = await paymentRepo.getTotalPaidForSale(
        command.saleId,
        command.organizationId,
      );

      if (totalPaid + command.amount > saleTotal) {
        throw new ConflictError(
          `Payment would exceed sale total. Already paid: ${totalPaid}, sale total: ${saleTotal}.`,
        );
      }

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
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('idempotencyKey') || msg.includes('Unique constraint')) {
          if (command.idempotencyKey) {
            const winner = await paymentRepo.findByIdempotencyKey(command.idempotencyKey);
            if (winner) return this._toResponse(winner);
          }
          throw new ConflictError('Duplicate payment request.');
        }
        throw err;
      }

      const payment = await paymentRepo.findById(paymentId, command.organizationId);
      if (!payment) throw new NotFoundError('Payment not found after creation.');

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

  private async _createMpesaPayment(command: CreatePaymentCommand): Promise<PaymentResponse> {
    if (!command.phone) {
      throw new ValidationError('Phone number is required for M-Pesa payments.');
    }

    // Validate sale + guard against overpayment + pending M-Pesa block — all in one transaction
    const { paymentId } = await this._unitOfWork.execute(async (tx) => {
      const paymentRepo = new PaymentRepositoryImpl(tx);

      // Idempotency check first
      if (command.idempotencyKey) {
        const existing = await paymentRepo.findByIdempotencyKey(command.idempotencyKey);
        if (existing) {
          if (existing.organizationId !== command.organizationId) {
            throw new ConflictError('Idempotency key conflict.');
          }
          return { paymentId: existing.id, existing };
        }
      }

      const sale = await tx.sale.findFirst({
        where: { id: command.saleId, organizationId: command.organizationId },
        select: { total: true, number: true },
      });
      if (!sale) throw new NotFoundError('Sale not found.');

      const saleTotal = Number(sale.total);
      const totalPaid = await paymentRepo.getTotalPaidForSale(
        command.saleId,
        command.organizationId,
      );

      if (totalPaid + command.amount > saleTotal) {
        throw new ConflictError(
          `Payment would exceed sale total. Already paid: ${totalPaid}, sale total: ${saleTotal}.`,
        );
      }

      // Block if there is already a PENDING M-Pesa payment for this sale.
      // A pending payment could eventually settle and cause overpayment.
      const hasPending = await paymentRepo.hasPendingMpesa(command.saleId, command.organizationId);
      if (hasPending) {
        throw new ConflictError(
          'A pending M-Pesa payment already exists for this sale. Wait for it to complete or fail before retrying.',
        );
      }

      // Create PENDING payment record before calling Daraja
      let paymentId: string;
      try {
        paymentId = await paymentRepo.create({
          organizationId: command.organizationId,
          saleId: command.saleId,
          method: 'MPESA',
          amount: command.amount,
          status: PaymentStatuses.PENDING,
          idempotencyKey: command.idempotencyKey,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('idempotencyKey') || msg.includes('Unique constraint')) {
          if (command.idempotencyKey) {
            const winner = await paymentRepo.findByIdempotencyKey(command.idempotencyKey);
            if (winner) return { paymentId: winner.id };
          }
          throw new ConflictError('Duplicate payment request.');
        }
        throw err;
      }

      return { paymentId };
    });

    // Initiate STK push outside the transaction — network call must not hold a DB lock
    try {
      const stkResult = await initiateStkPush({
        phone: command.phone,
        amount: command.amount,
        accountReference: command.saleNumber ?? command.saleId.slice(0, 12),
        transactionDesc: 'POS Payment',
      });

      // Store the Daraja CheckoutRequestID so the callback can locate this payment
      await this._prisma.payment.update({
        where: { id: paymentId },
        data: { darajaRequestId: stkResult.checkoutRequestId },
      });
    } catch (err) {
      // STK push failed — mark payment FAILED so the pending guard is released
      await this._prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
      });
      throw err;
    }

    const paymentRepo = new PaymentRepositoryImpl(this._prisma);
    const payment = await paymentRepo.findById(paymentId, command.organizationId);
    if (!payment) throw new NotFoundError('Payment not found after STK push.');

    return this._toResponse(payment);
  }

  async findBySaleId(saleId: string, organizationId: string): Promise<PaymentResponse[]> {
    const paymentRepo = new PaymentRepositoryImpl(this._prisma);
    const payments = await paymentRepo.findBySaleId(saleId, organizationId);
    return payments.map((p) => this._toResponse(p));
  }

  async findById(id: string, organizationId: string): Promise<PaymentResponse | null> {
    const paymentRepo = new PaymentRepositoryImpl(this._prisma);
    const payment = await paymentRepo.findById(id, organizationId);
    return payment ? this._toResponse(payment) : null;
  }

  /**
   * Called by the Daraja callback when ResultCode === 0 (success).
   * Idempotent: if already PAID, returns without error.
   */
  async confirmMpesaPayment(checkoutRequestId: string, mpesaReceiptNumber?: string): Promise<void> {
    const paymentRepo = new PaymentRepositoryImpl(this._prisma);
    const payment = await paymentRepo.findByDarajaRequestId(checkoutRequestId);
    if (!payment) return; // unknown request — ignore
    if (payment.status === PaymentStatuses.PAID) return; // already confirmed — idempotent
    if (payment.status === PaymentStatuses.FAILED) return; // already failed — ignore late success

    await paymentRepo.updateStatus(payment.id, PaymentStatuses.PAID, {
      paidAt: new Date(),
      darajaTransactionId: mpesaReceiptNumber,
    });

    await this._eventBus.publish(
      new PaymentReceivedEvent(
        payment.id,
        payment.saleId,
        payment.organizationId,
        payment.amount,
        'MPESA',
      ),
    );
  }

  /**
   * Called by the Daraja callback when ResultCode !== 0 (cancelled/failed).
   * Idempotent: if already FAILED or PAID, returns without error.
   */
  async failMpesaPayment(checkoutRequestId: string, _reason?: string): Promise<void> {
    const paymentRepo = new PaymentRepositoryImpl(this._prisma);
    const payment = await paymentRepo.findByDarajaRequestId(checkoutRequestId);
    if (!payment) return;
    if (payment.status !== PaymentStatuses.PENDING) return; // already settled — idempotent

    await paymentRepo.updateStatus(payment.id, PaymentStatuses.FAILED);
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
    darajaRequestId?: string;
    darajaTransactionId?: string;
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
      darajaRequestId: payment.darajaRequestId,
      darajaTransactionId: payment.darajaTransactionId,
    };
  }
}
