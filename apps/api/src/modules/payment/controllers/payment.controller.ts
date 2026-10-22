import type { FastifyRequest, FastifyReply } from 'fastify';
import type { PaymentService } from '../service/payment.service.js';

export class PaymentController {
  constructor(private readonly _paymentService: PaymentService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      saleId: string;
      saleNumber?: string;
      method: string;
      amount: number;
      reference?: string;
      phone?: string;
      idempotencyKey?: string;
    };

    const payment = await this._paymentService.create({
      organizationId: request.requestContext.organizationId,
      saleId: body.saleId,
      saleNumber: body.saleNumber,
      method: body.method as 'CASH' | 'MPESA' | 'CARD' | 'BANK' | 'CREDIT',
      amount: body.amount,
      reference: body.reference,
      phone: body.phone,
      idempotencyKey: body.idempotencyKey,
    });

    return reply.status(201).send({
      success: true,
      message: 'Payment recorded successfully.',
      data: payment,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const payment = await this._paymentService.findById(id, request.requestContext.organizationId);

    if (!payment) {
      return reply.status(404).send({
        success: false,
        message: 'Payment not found.',
      });
    }

    return reply.status(200).send({
      success: true,
      message: 'Payment retrieved successfully.',
      data: payment,
    });
  }

  async findBySaleId(request: FastifyRequest, reply: FastifyReply) {
    const { saleId } = request.params as { saleId: string };

    const payments = await this._paymentService.findBySaleId(
      saleId,
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Payments retrieved successfully.',
      data: payments,
    });
  }
}
