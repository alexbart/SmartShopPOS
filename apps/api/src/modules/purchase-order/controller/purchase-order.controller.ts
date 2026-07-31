import type { FastifyRequest, FastifyReply } from 'fastify';
import type { PurchaseOrderService } from '../service/purchase-order.service.js';

export class PurchaseOrderController {
  constructor(private readonly _purchaseOrderService: PurchaseOrderService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      supplierId: string;
      warehouseId: string;
      branchId: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitCost: number;
        discount?: number;
        tax?: number;
      }>;
      expectedDeliveryDate?: string;
      discount?: number;
      tax?: number;
      notes?: string;
    };

    const po = await this._purchaseOrderService.create({
      organizationId: request.requestContext.organizationId,
      branchId: body.branchId,
      warehouseId: body.warehouseId,
      supplierId: body.supplierId,
      items: body.items,
      expectedDeliveryDate: body.expectedDeliveryDate
        ? new Date(body.expectedDeliveryDate)
        : undefined,
      discount: body.discount,
      tax: body.tax,
      notes: body.notes,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Purchase order created successfully.',
      data: po,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const po = await this._purchaseOrderService.findById(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Purchase order retrieved successfully.',
      data: po,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const body = request.body as {
      items?: Array<{
        productId: string;
        quantity: number;
        unitCost: number;
        discount?: number;
        tax?: number;
      }>;
      expectedDeliveryDate?: string;
      discount?: number;
      tax?: number;
      notes?: string;
    };

    const po = await this._purchaseOrderService.update({
      id,
      organizationId: request.requestContext.organizationId,
      items: body.items,
      expectedDeliveryDate: body.expectedDeliveryDate
        ? new Date(body.expectedDeliveryDate)
        : undefined,
      discount: body.discount,
      tax: body.tax,
      notes: body.notes,
      createdBy: request.requestContext.userId,
    });

    return reply.status(200).send({
      success: true,
      message: 'Purchase order updated successfully.',
      data: po,
    });
  }

  async submit(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const po = await this._purchaseOrderService.submit(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Purchase order submitted successfully.',
      data: po,
    });
  }

  async cancel(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._purchaseOrderService.cancel(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Purchase order cancelled successfully.',
    });
  }

  async receiveGoods(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const body = request.body as {
      warehouseId: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitCost: number;
      }>;
      notes?: string;
    };

    const result = await this._purchaseOrderService.receiveGoods({
      purchaseOrderId: id,
      organizationId: request.requestContext.organizationId,
      warehouseId: body.warehouseId,
      items: body.items,
      createdBy: request.requestContext.userId,
      notes: body.notes,
    });

    return reply.status(200).send({
      success: true,
      message: 'Goods received successfully.',
      data: result,
    });
  }
}
