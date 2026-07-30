import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ProductService } from '../service/product.service.js';

export class ProductController {
  constructor(private readonly _productService: ProductService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      name: string;
      code: string;
      description?: string;
      sku?: string;
      barcode?: string;
      categoryId?: string;
      brandId?: string;
      unitId: string;
      taxId?: string;
      costPrice: number;
      sellingPrice: number;
    };

    const product = await this._productService.create({
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      sku: body.sku,
      barcode: body.barcode,
      categoryId: body.categoryId,
      brandId: body.brandId,
      unitId: body.unitId,
      taxId: body.taxId,
      costPrice: body.costPrice,
      sellingPrice: body.sellingPrice,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      active?: string;
      categoryId?: string;
      brandId?: string;
    };

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    const result = await this._productService.findAll({
      organizationId: request.requestContext.organizationId,
      page,
      limit,
      search: query.search,
      active: query.active !== undefined ? query.active === 'true' : undefined,
      categoryId: query.categoryId,
      brandId: query.brandId,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    return reply.status(200).send({
      success: true,
      message: 'Products retrieved successfully.',
      data: result,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const product = await this._productService.findById(id, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Product retrieved successfully.',
      data: product,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      code?: string;
      description?: string;
      sku?: string | null;
      barcode?: string | null;
      categoryId?: string | null;
      brandId?: string | null;
      unitId?: string;
      taxId?: string | null;
      costPrice?: number;
      sellingPrice?: number;
      isActive?: boolean;
    };

    const product = await this._productService.update({
      id,
      organizationId: request.requestContext.organizationId,
      name: body.name,
      code: body.code,
      description: body.description,
      sku: body.sku,
      barcode: body.barcode,
      categoryId: body.categoryId,
      brandId: body.brandId,
      unitId: body.unitId,
      taxId: body.taxId,
      costPrice: body.costPrice,
      sellingPrice: body.sellingPrice,
      isActive: body.isActive,
      updatedBy: request.requestContext.userId,
    });

    return reply.status(200).send({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._productService.delete(id, request.requestContext.organizationId);

    return reply.status(204).send();
  }
}
