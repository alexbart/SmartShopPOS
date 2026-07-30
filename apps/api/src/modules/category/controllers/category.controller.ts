import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CategoryService } from '../service/category.service.js';

export class CategoryController {
  constructor(private readonly _categoryService: CategoryService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      name: string;
      code: string;
      description?: string;
      color?: string;
    };

    const category = await this._categoryService.create({
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      color: body.color,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Category created successfully.',
      data: category,
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

    const result = await this._categoryService.findAll({
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
      message: 'Categories retrieved successfully.',
      data: result,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const category = await this._categoryService.findById(
      id,
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Category retrieved successfully.',
      data: category,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      code?: string;
      description?: string;
      color?: string;
      isActive?: boolean;
    };

    const category = await this._categoryService.update({
      id,
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      color: body.color,
      isActive: body.isActive,
      updatedBy: request.requestContext.userId,
    });

    return reply.status(200).send({
      success: true,
      message: 'Category updated successfully.',
      data: category,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._categoryService.delete(id, request.requestContext.organizationId);

    return reply.status(204).send();
  }
}
