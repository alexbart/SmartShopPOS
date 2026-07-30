import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UnitService } from '../service/unit.service.js';

export class UnitController {
  constructor(private readonly _unitService: UnitService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      name: string;
      code: string;
      description?: string;
      abbreviation?: string;
    };

    const unit = await this._unitService.create({
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      abbreviation: body.abbreviation,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Unit created successfully.',
      data: unit,
    });
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      active?: string;
    };

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    const result = await this._unitService.findAll({
      organizationId: request.requestContext.organizationId,
      page,
      limit,
      search: query.search,
      active: query.active !== undefined ? query.active === 'true' : undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    return reply.status(200).send({
      success: true,
      message: 'Units retrieved successfully.',
      data: result,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const unit = await this._unitService.findById(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Unit retrieved successfully.',
      data: unit,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      code?: string;
      description?: string;
      abbreviation?: string;
      isActive?: boolean;
    };

    const unit = await this._unitService.update({
      id,
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      abbreviation: body.abbreviation,
      isActive: body.isActive,
      updatedBy: request.requestContext.userId,
    });

    return reply.status(200).send({
      success: true,
      message: 'Unit updated successfully.',
      data: unit,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._unitService.delete(id, request.requestContext.organizationId);

    return reply.status(204).send();
  }
}
