import type { FastifyRequest, FastifyReply } from 'fastify';
import type { InventoryReportService } from '../service/inventory-report.service.js';

export class InventoryReportController {
  constructor(private readonly _inventoryReportService: InventoryReportService) {}

  async getCurrentStock(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      warehouseId?: string;
      categoryId?: string;
      brandId?: string;
      supplierId?: string;
      search?: string;
      activeOnly?: string;
      page?: string;
      limit?: string;
    };

    const filters = {
      organizationId: request.requestContext.organizationId,
      warehouseId: query.warehouseId,
      categoryId: query.categoryId,
      brandId: query.brandId,
      supplierId: query.supplierId,
      search: query.search,
      activeOnly: query.activeOnly === 'true',
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };

    const report = await this._inventoryReportService.getCurrentStock(filters);

    return reply.status(200).send({
      success: true,
      message: 'Current stock report retrieved successfully.',
      data: report,
    });
  }

  async getStockMovements(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      from?: string;
      to?: string;
      warehouseId?: string;
      productId?: string;
      movementType?: string;
      performedBy?: string;
      page?: string;
      limit?: string;
    };

    const filters = {
      organizationId: request.requestContext.organizationId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      warehouseId: query.warehouseId,
      productId: query.productId,
      movementType: query.movementType,
      performedBy: query.performedBy,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };

    const report = await this._inventoryReportService.getStockMovements(filters);

    return reply.status(200).send({
      success: true,
      message: 'Stock movements report retrieved successfully.',
      data: report,
    });
  }

  async getLowStock(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      warehouseId?: string;
      categoryId?: string;
      brandId?: string;
      page?: string;
      limit?: string;
    };

    const filters = {
      organizationId: request.requestContext.organizationId,
      warehouseId: query.warehouseId,
      categoryId: query.categoryId,
      brandId: query.brandId,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };

    const report = await this._inventoryReportService.getLowStock(filters);

    return reply.status(200).send({
      success: true,
      message: 'Low stock report retrieved successfully.',
      data: report,
    });
  }

  async getOutOfStock(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      warehouseId?: string;
      categoryId?: string;
      brandId?: string;
      page?: string;
      limit?: string;
    };

    const filters = {
      organizationId: request.requestContext.organizationId,
      warehouseId: query.warehouseId,
      categoryId: query.categoryId,
      brandId: query.brandId,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };

    const report = await this._inventoryReportService.getOutOfStock(filters);

    return reply.status(200).send({
      success: true,
      message: 'Out of stock report retrieved successfully.',
      data: report,
    });
  }
}
