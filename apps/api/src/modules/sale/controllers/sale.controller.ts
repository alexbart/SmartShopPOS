import type { FastifyRequest, FastifyReply } from 'fastify';
import type { SaleService } from '../service/sale.service.js';

export class SaleController {
  constructor(private readonly _saleService: SaleService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      warehouseId: string;
      customerId?: string;
      items: Array<{
        productId: string;
        quantity: number;
        price: number;
        discount?: number;
        tax?: number;
      }>;
      discount?: number;
      tax?: number;
    };

    const sale = await this._saleService.create({
      organizationId: request.requestContext.organizationId,
      warehouseId: body.warehouseId,
      cashierId: request.requestContext.userId,
      customerId: body.customerId,
      items: body.items,
      discount: body.discount,
      tax: body.tax,
    });

    return reply.status(201).send({
      success: true,
      message: 'Sale created successfully.',
      data: sale,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const sale = await this._saleService.findById(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Sale retrieved successfully.',
      data: sale,
    });
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { page?: string; limit?: string };
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;

    const result = await this._saleService.list(request.requestContext.organizationId, page, limit);

    return reply.status(200).send({
      success: true,
      message: 'Sales retrieved successfully.',
      data: result,
    });
  }

  async void(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._saleService.void(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Sale voided successfully.',
    });
  }
}
