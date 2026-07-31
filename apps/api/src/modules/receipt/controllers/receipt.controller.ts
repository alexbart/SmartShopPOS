import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ReceiptService } from '../service/receipt.service.js';

export class ReceiptController {
  constructor(private readonly _receiptService: ReceiptService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { saleId: string };

    const receipt = await this._receiptService.create({
      organizationId: request.requestContext.organizationId,
      saleId: body.saleId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Receipt created successfully.',
      data: receipt,
    });
  }

  async findByNumber(request: FastifyRequest, reply: FastifyReply) {
    const { number } = request.params as { number: string };

    const receipt = await this._receiptService.findByNumber(number, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Receipt retrieved successfully.',
      data: receipt,
    });
  }

  async findBySaleId(request: FastifyRequest, reply: FastifyReply) {
    const { saleId } = request.params as { saleId: string };

    const receipt = await this._receiptService.findBySaleId(saleId, request.requestContext.organizationId);

    if (!receipt) {
      return reply.status(404).send({
        success: false,
        message: 'Receipt not found for this sale.',
      });
    }

    return reply.status(200).send({
      success: true,
      message: 'Receipt retrieved successfully.',
      data: receipt,
    });
  }
}
