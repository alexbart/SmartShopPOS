import type { FastifyRequest, FastifyReply } from 'fastify';
import { StockService } from '../services/stock.service.js';
import { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InventoryController {
  private _stockService: StockService;

  constructor() {
    const unitOfWork = new UnitOfWork();
    this._stockService = new StockService(unitOfWork, prisma);
  }

  async getStockLevel(request: FastifyRequest, reply: FastifyReply) {
    const { warehouseId, productId } = request.params as { warehouseId: string; productId: string };

    const result = await this._stockService.getStockLevel({
      organizationId: request.requestContext.organizationId,
      warehouseId,
      productId,
    });

    if (!result) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Stock not found.',
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: 'Stock level retrieved successfully.',
      data: result,
    });
  }

  async listStock(request: FastifyRequest, reply: FastifyReply) {
    const { warehouseId } = request.params as { warehouseId: string };

    const result = await this._stockService.listStock({
      organizationId: request.requestContext.organizationId,
      warehouseId,
    });

    return reply.status(200).send({
      success: true,
      message: 'Stock levels retrieved successfully.',
      data: result,
    });
  }
}
