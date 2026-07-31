import type { FastifyRequest, FastifyReply } from 'fastify';
import type { SupplierService } from '../service/supplier.service.js';

export class SupplierController {
  constructor(private readonly _supplierService: SupplierService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      code: string;
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      taxPin?: string;
      creditLimit?: number;
      paymentTerms?: string;
    };

    const supplier = await this._supplierService.create({
      organizationId: request.requestContext.organizationId,
      code: body.code,
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      taxPin: body.taxPin,
      creditLimit: body.creditLimit,
      paymentTerms: body.paymentTerms,
    });

    return reply.status(201).send({
      success: true,
      message: 'Supplier created successfully.',
      data: supplier,
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

    const result = await this._supplierService.findAll({
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
      message: 'Suppliers retrieved successfully.',
      data: result,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const supplier = await this._supplierService.findById(
      id,
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Supplier retrieved successfully.',
      data: supplier,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      code?: string;
      name?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      taxPin?: string;
      creditLimit?: number | null;
      paymentTerms?: string | null;
      isActive?: boolean;
    };

    const supplier = await this._supplierService.update({
      id,
      organizationId: request.requestContext.organizationId,
      code: body.code,
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      taxPin: body.taxPin,
      creditLimit: body.creditLimit,
      paymentTerms: body.paymentTerms,
      isActive: body.isActive,
    });

    return reply.status(200).send({
      success: true,
      message: 'Supplier updated successfully.',
      data: supplier,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._supplierService.delete(id, request.requestContext.organizationId);

    return reply.status(204).send();
  }
}
