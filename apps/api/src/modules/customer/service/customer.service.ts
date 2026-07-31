import type { ICustomerRepository } from '../repositories/customer.repository.js';
import type { CreateCustomerCommand } from '../commands/create-customer.command.js';
import type { UpdateCustomerCommand } from '../commands/update-customer.command.js';
import type { CustomerQuery } from '../repositories/customer.repository.js';
import type { CustomerResponse } from '../responses/customer.response.js';
import type { CustomerListResponse } from '../responses/customer-list.response.js';

export class CustomerService {
  constructor(private readonly _repository: ICustomerRepository) {}

  async create(command: CreateCustomerCommand): Promise<CustomerResponse> {
    const existingByCode = await this._repository.findByCode(command.code, command.organizationId);
    if (existingByCode) {
      throw new Error('Customer code already exists.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    const id = await this._repository.create(command);

    const customer = await this._repository.findById(id, command.organizationId);
    if (!customer) {
      throw new Error('Customer not found after creation.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(customer);
  }

  async update(command: UpdateCustomerCommand): Promise<CustomerResponse> {
    const existing = await this._repository.findById(command.id, command.organizationId);
    if (!existing) {
      throw new Error('Customer not found.') as Error & { code: string; statusCode: number };
    }

    if (command.code && command.code !== existing.code) {
      const duplicate = await this._repository.findByCode(command.code, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Customer code already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    await this._repository.update(command);

    const updated = await this._repository.findById(command.id, command.organizationId);
    if (!updated) {
      throw new Error('Customer not found after update.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(updated);
  }

  async findById(id: string, organizationId: string): Promise<CustomerResponse> {
    const customer = await this._repository.findById(id, organizationId);
    if (!customer) {
      throw new Error('Customer not found.') as Error & { code: string; statusCode: number };
    }

    return this.toResponse(customer);
  }

  async findAll(query: CustomerQuery): Promise<CustomerListResponse> {
    const { items, total } = await this._repository.findAll(query);

    return {
      items: items.map((customer) => this.toResponse(customer)),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const customer = await this._repository.findById(id, organizationId);
    if (!customer) {
      throw new Error('Customer not found.') as Error & { code: string; statusCode: number };
    }

    await this._repository.softDelete(id, organizationId);
  }

  private toResponse(customer: {
    id: string;
    organizationId: string;
    code: string;
    name: string;
    phone?: string;
    email?: string;
    taxPin?: string;
    address?: string;
    loyaltyPoints: number;
    creditLimit?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CustomerResponse {
    return {
      id: customer.id,
      organizationId: customer.organizationId,
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      taxPin: customer.taxPin,
      address: customer.address,
      loyaltyPoints: customer.loyaltyPoints,
      creditLimit: customer.creditLimit,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
