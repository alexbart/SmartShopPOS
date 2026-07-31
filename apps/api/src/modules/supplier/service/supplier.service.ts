import type { ISupplierRepository } from '../repositories/supplier.repository.js';
import type { CreateSupplierCommand } from '../commands/create-supplier.command.js';
import type { UpdateSupplierCommand } from '../commands/update-supplier.command.js';
import type { SupplierQuery } from '../repositories/supplier.repository.js';
import type { SupplierResponse } from '../responses/supplier.response.js';
import type { SupplierListResponse } from '../responses/supplier-list.response.js';

export class SupplierService {
  constructor(private readonly _repository: ISupplierRepository) {}

  async create(command: CreateSupplierCommand): Promise<SupplierResponse> {
    const existingByCode = await this._repository.findByCode(command.code, command.organizationId);
    if (existingByCode) {
      throw new Error('Supplier code already exists.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    const existingByName = await this._repository.findByCode(command.name, command.organizationId);
    if (existingByName) {
      throw new Error('Supplier name already exists.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    const id = await this._repository.create(command);

    const supplier = await this._repository.findById(id, command.organizationId);
    if (!supplier) {
      throw new Error('Supplier not found after creation.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(supplier);
  }

  async update(command: UpdateSupplierCommand): Promise<SupplierResponse> {
    const existing = await this._repository.findById(command.id, command.organizationId);
    if (!existing) {
      throw new Error('Supplier not found.') as Error & { code: string; statusCode: number };
    }

    if (command.code && command.code !== existing.code) {
      const duplicate = await this._repository.findByCode(command.code, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Supplier code already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    if (command.name && command.name !== existing.name) {
      const duplicate = await this._repository.findByCode(command.name, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Supplier name already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    await this._repository.update(command);

    const updated = await this._repository.findById(command.id, command.organizationId);
    if (!updated) {
      throw new Error('Supplier not found after update.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(updated);
  }

  async findById(id: string, organizationId: string): Promise<SupplierResponse> {
    const supplier = await this._repository.findById(id, organizationId);
    if (!supplier) {
      throw new Error('Supplier not found.') as Error & { code: string; statusCode: number };
    }

    return this.toResponse(supplier);
  }

  async findAll(query: SupplierQuery): Promise<SupplierListResponse> {
    const { items, total } = await this._repository.findAll(query);

    return {
      items: items.map((supplier) => this.toResponse(supplier)),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const supplier = await this._repository.findById(id, organizationId);
    if (!supplier) {
      throw new Error('Supplier not found.') as Error & { code: string; statusCode: number };
    }

    await this._repository.softDelete(id, organizationId);
  }

  private toResponse(supplier: {
    id: string;
    organizationId: string;
    code: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    taxPin?: string;
    creditLimit?: number;
    paymentTerms?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SupplierResponse {
    return {
      id: supplier.id,
      organizationId: supplier.organizationId,
      code: supplier.code,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      taxPin: supplier.taxPin,
      creditLimit: supplier.creditLimit,
      paymentTerms: supplier.paymentTerms,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  }
}
