import type { FastifyRequest, FastifyReply } from 'fastify';
import type { WarehouseService } from '../service/warehouse.service.js';

export class WarehouseController {
  constructor(private readonly _warehouseService: WarehouseService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      code: string;
      name: string;
      description?: string;
      isDefault?: boolean;
    };

    const branchId = request.params?.branchId ?? request.requestContext.branchId;

    const warehouse = await this._warehouseService.create({
      organizationId: request.requestContext.organizationId,
      branchId,
      code: body.code,
      name: body.name,
      description: body.description,
      isDefault: body.isDefault,
    });

    return reply.status(201).send({
      success: true,
      message: 'Warehouse created successfully.',
      data: warehouse,
    });
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      active?: string;
      branchId?: string;
    };

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    const result = await this._warehouseService.findAll({
      organizationId: request.requestContext.organizationId,
      page,
      limit,
      search: query.search,
      active: query.active !== undefined ? query.active === 'true' : undefined,
      branchId: query.branchId,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    return reply.status(200).send({
      success: true,
      message: 'Warehouses retrieved successfully.',
      data: result,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const warehouse = await this._warehouseService.findById(
      id,
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Warehouse retrieved successfully.',
      data: warehouse,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      code?: string;
      name?: string;
      description?: string;
      isDefault?: boolean;
      isActive?: boolean;
    };

    const warehouse = await this._warehouseService.update({
      id,
      organizationId: request.requestContext.organizationId,
      code: body.code,
      name: body.name,
      description: body.description,
      isDefault: body.isDefault,
      isActive: body.isActive,
    });

    return reply.status(200).send({
      success: true,
      message: 'Warehouse updated successfully.',
      data: warehouse,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._warehouseService.delete(id, request.requestContext.organizationId);

    return reply.status(204).send();
  }
}
