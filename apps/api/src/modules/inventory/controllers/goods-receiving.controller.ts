import type { FastifyRequest, FastifyReply } from 'fastify';
import { StockService } from '../services/stock.service.js';
import { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GoodsReceivingController {
  private _stockService: StockService;

  constructor() {
    const unitOfWork = new UnitOfWork();
    this._stockService = new StockService(unitOfWork, prisma);
  }

  async receiveGoods(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      warehouseId: string;
      productId: string;
      quantity: number;
      remarks?: string;
    };

    await this._stockService.increase({
      organizationId: request.requestContext.organizationId,
      warehouseId: body.warehouseId,
      productId: body.productId,
      quantity: body.quantity,
      type: 'PURCHASE',
      performedBy: request.requestContext.userId,
      referenceType: 'GOODS_RECEIVING',
      remarks: body.remarks,
    });

    return reply.status(201).send({
      success: true,
      message: 'Goods received and stock increased successfully.',
    });
  }

  async recordSale(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      warehouseId: string;
      productId: string;
      quantity: number;
      remarks?: string;
    };

    await this._stockService.decrease({
      organizationId: request.requestContext.organizationId,
      warehouseId: body.warehouseId,
      productId: body.productId,
      quantity: body.quantity,
      type: 'SALE',
      performedBy: request.requestContext.userId,
      referenceType: 'SALE',
      remarks: body.remarks,
    });

    return reply.status(201).send({
      success: true,
      message: 'Sale recorded and stock decreased successfully.',
    });
  }

  async recordReturn(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      warehouseId: string;
      productId: string;
      quantity: number;
      remarks?: string;
    };

    await this._stockService.increase({
      organizationId: request.requestContext.organizationId,
      warehouseId: body.warehouseId,
      productId: body.productId,
      quantity: body.quantity,
      type: 'RETURN',
      performedBy: request.requestContext.userId,
      referenceType: 'RETURN',
      remarks: body.remarks,
    });

    return reply.status(201).send({
      success: true,
      message: 'Return recorded and stock increased successfully.',
    });
  }

  async adjustStock(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      warehouseId: string;
      productId: string;
      quantity: number;
      type: 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED';
      remarks?: string;
    };

    await this._stockService.adjust({
      organizationId: request.requestContext.organizationId,
      warehouseId: body.warehouseId,
      productId: body.productId,
      quantity: body.quantity,
      type: body.type,
      performedBy: request.requestContext.userId,
      remarks: body.remarks,
    });

    return reply.status(201).send({
      success: true,
      message: `Stock ${body.type.toLowerCase()} recorded successfully.`,
    });
  }

  async transferStock(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      fromWarehouseId: string;
      toWarehouseId: string;
      productId: string;
      quantity: number;
      remarks?: string;
    };

    await this._stockService.transfer({
      organizationId: request.requestContext.organizationId,
      fromWarehouseId: body.fromWarehouseId,
      toWarehouseId: body.toWarehouseId,
      productId: body.productId,
      quantity: body.quantity,
      performedBy: request.requestContext.userId,
      remarks: body.remarks,
    });

    return reply.status(201).send({
      success: true,
      message: 'Stock transferred successfully.',
    });
  }
}
