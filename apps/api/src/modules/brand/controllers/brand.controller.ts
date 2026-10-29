import type { FastifyRequest, FastifyReply } from 'fastify';
import type { BrandService } from '../service/brand.service.js';

export class BrandController {
  constructor(private readonly _brandService: BrandService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      name: string;
      code: string;
      description?: string;
      logoUrl?: string;
      website?: string;
    };

    const brand = await this._brandService.create({
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      logoUrl: body.logoUrl,
      website: body.website,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Brand created successfully.',
      data: brand,
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

    const result = await this._brandService.findAll({
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
      message: 'Brands retrieved successfully.',
      data: result,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const brand = await this._brandService.findById(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Brand retrieved successfully.',
      data: brand,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      code?: string;
      description?: string;
      logoUrl?: string;
      website?: string;
      isActive?: boolean;
    };

    const brand = await this._brandService.update({
      id,
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      logoUrl: body.logoUrl,
      website: body.website,
      isActive: body.isActive,
      updatedBy: request.requestContext.userId,
    });

    return reply.status(200).send({
      success: true,
      message: 'Brand updated successfully.',
      data: brand,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._brandService.delete(id, request.requestContext.organizationId);

    return reply.status(204).send();
  }
}
