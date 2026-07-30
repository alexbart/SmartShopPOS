import type { ITaxRepository } from '../repositories/tax.repository.js';
import type { CreateTaxCommand } from '../commands/create-tax.command.js';
import type { UpdateTaxCommand } from '../commands/update-tax.command.js';
import type { TaxQuery } from '../repositories/tax.repository.js';
import type { TaxResponse } from '../responses/tax.response.js';
import type { TaxListResponse } from '../responses/tax-list.response.js';

export class TaxService {
  constructor(private readonly _repository: ITaxRepository) {}

  async create(command: CreateTaxCommand): Promise<TaxResponse> {
    const existingByCode = await this._repository.findByCode(command.code, command.organizationId);
    if (existingByCode) {
      throw new Error('Tax code already exists.') as Error & { code: string; statusCode: number };
    }

    const existingByName = await this._repository.findByCode(command.name, command.organizationId);
    if (existingByName) {
      throw new Error('Tax name already exists.') as Error & { code: string; statusCode: number };
    }

    const id = await this._repository.create(command);

    const tax = await this._repository.findById(id, command.organizationId);
    if (!tax) {
      throw new Error('Tax not found after creation.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(tax);
  }

  async update(command: UpdateTaxCommand): Promise<TaxResponse> {
    const existing = await this._repository.findById(command.id, command.organizationId);
    if (!existing) {
      throw new Error('Tax not found.') as Error & { code: string; statusCode: number };
    }

    if (command.code && command.code !== existing.code) {
      const duplicate = await this._repository.findByCode(command.code, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Tax code already exists.') as Error & { code: string; statusCode: number };
      }
    }

    if (command.name && command.name !== existing.name) {
      const duplicate = await this._repository.findByCode(command.name, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Tax name already exists.') as Error & { code: string; statusCode: number };
      }
    }

    await this._repository.update(command);

    const updated = await this._repository.findById(command.id, command.organizationId);
    if (!updated) {
      throw new Error('Tax not found after update.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(updated);
  }

  async findById(id: string, organizationId: string): Promise<TaxResponse> {
    const tax = await this._repository.findById(id, organizationId);
    if (!tax) {
      throw new Error('Tax not found.') as Error & { code: string; statusCode: number };
    }

    return this.toResponse(tax);
  }

  async findAll(query: TaxQuery): Promise<TaxListResponse> {
    const { items, total } = await this._repository.findAll(query);

    return {
      items: items.map((tax) => this.toResponse(tax)),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const tax = await this._repository.findById(id, organizationId);
    if (!tax) {
      throw new Error('Tax not found.') as Error & { code: string; statusCode: number };
    }

    await this._repository.softDelete(id, organizationId);
  }

  private toResponse(tax: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description?: string;
    rate: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): TaxResponse {
    return {
      id: tax.id,
      organizationId: tax.organizationId,
      name: tax.name,
      code: tax.code,
      description: tax.description,
      rate: tax.rate,
      isActive: tax.isActive,
      createdAt: tax.createdAt,
      updatedAt: tax.updatedAt,
    };
  }
}
