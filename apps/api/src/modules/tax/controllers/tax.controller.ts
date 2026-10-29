import type { FastifyRequest, FastifyReply } from 'fastify';
import type { TaxService } from '../service/tax.service.js';

export class TaxController {
  constructor(private readonly _taxService: TaxService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      name: string;
      code: string;
      description?: string;
      rate: number;
    };

    const tax = await this._taxService.create({
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      rate: body.rate,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Tax created successfully.',
      data: tax,
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

    const result = await this._taxService.findAll({
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
      message: 'Taxes retrieved successfully.',
      data: result,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const tax = await this._taxService.findById(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Tax retrieved successfully.',
      data: tax,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      code?: string;
      description?: string;
      rate?: number;
      isActive?: boolean;
    };

    const tax = await this._taxService.update({
      id,
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      rate: body.rate,
      isActive: body.isActive,
      updatedBy: request.requestContext.userId,
    });

    return reply.status(200).send({
      success: true,
      message: 'Tax updated successfully.',
      data: tax,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._taxService.delete(id, request.requestContext.organizationId);

    return reply.status(204).send();
  }
}
