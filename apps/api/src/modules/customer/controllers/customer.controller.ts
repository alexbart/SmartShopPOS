import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CustomerService } from '../service/customer.service.js';

export class CustomerController {
  constructor(private readonly _customerService: CustomerService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      code: string;
      name: string;
      phone?: string;
      email?: string;
      taxPin?: string;
      address?: string;
      creditLimit?: number;
    };

    const customer = await this._customerService.create({
      organizationId: request.requestContext.organizationId,
      code: body.code,
      name: body.name,
      phone: body.phone,
      email: body.email,
      taxPin: body.taxPin,
      address: body.address,
      creditLimit: body.creditLimit,
    });

    return reply.status(201).send({
      success: true,
      message: 'Customer created successfully.',
      data: customer,
    });
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      page?: string;
      limit?: string;
      search?: string;
      active?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    const result = await this._customerService.findAll({
      organizationId: request.requestContext.organizationId,
      page,
      limit,
      search: query.search,
      active: query.active !== undefined ? query.active === 'true' : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder ?? 'asc',
    });

    return reply.status(200).send({
      success: true,
      message: 'Customers retrieved successfully.',
      data: result,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const customer = await this._customerService.findById(
      id,
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Customer retrieved successfully.',
      data: customer,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      code?: string;
      name?: string;
      phone?: string;
      email?: string;
      taxPin?: string;
      address?: string;
      creditLimit?: number;
      isActive?: boolean;
    };

    const customer = await this._customerService.update({
      id,
      organizationId: request.requestContext.organizationId,
      code: body.code,
      name: body.name,
      phone: body.phone,
      email: body.email,
      taxPin: body.taxPin,
      address: body.address,
      creditLimit: body.creditLimit,
      isActive: body.isActive,
    });

    return reply.status(200).send({
      success: true,
      message: 'Customer updated successfully.',
      data: customer,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._customerService.delete(id, request.requestContext.organizationId);

    return reply.status(204).send();
  }
}
