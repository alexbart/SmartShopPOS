import type { IWarehouseRepository } from '../repositories/warehouse.repository.js';
import type { CreateWarehouseCommand } from '../commands/create-warehouse.command.js';
import type { UpdateWarehouseCommand } from '../commands/update-warehouse.command.js';
import type { WarehouseQuery } from '../repositories/warehouse.repository.js';
import type { WarehouseResponse } from '../responses/warehouse.response.js';
import type { WarehouseListResponse } from '../responses/warehouse-list.response.js';

export class WarehouseService {
  constructor(private readonly _repository: IWarehouseRepository) {}

  async create(command: CreateWarehouseCommand): Promise<WarehouseResponse> {
    const existingByCode = await this._repository.findByCode(command.code, command.organizationId);
    if (existingByCode) {
      throw new Error('Warehouse code already exists.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    const existingByName = await this._repository.findByCode(command.name, command.organizationId);
    if (existingByName) {
      throw new Error('Warehouse name already exists.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    const id = await this._repository.create(command);

    const warehouse = await this._repository.findById(id, command.organizationId);
    if (!warehouse) {
      throw new Error('Warehouse not found after creation.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(warehouse);
  }

  async update(command: UpdateWarehouseCommand): Promise<WarehouseResponse> {
    const existing = await this._repository.findById(command.id, command.organizationId);
    if (!existing) {
      throw new Error('Warehouse not found.') as Error & { code: string; statusCode: number };
    }

    if (command.code && command.code !== existing.code) {
      const duplicate = await this._repository.findByCode(command.code, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Warehouse code already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    if (command.name && command.name !== existing.name) {
      const duplicate = await this._repository.findByCode(command.name, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Warehouse name already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    await this._repository.update(command);

    const updated = await this._repository.findById(command.id, command.organizationId);
    if (!updated) {
      throw new Error('Warehouse not found after update.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(updated);
  }

  async findById(id: string, organizationId: string): Promise<WarehouseResponse> {
    const warehouse = await this._repository.findById(id, organizationId);
    if (!warehouse) {
      throw new Error('Warehouse not found.') as Error & { code: string; statusCode: number };
    }

    return this.toResponse(warehouse);
  }

  async findAll(query: WarehouseQuery): Promise<WarehouseListResponse> {
    const { items, total } = await this._repository.findAll(query);

    return {
      items: items.map((warehouse) => this.toResponse(warehouse)),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const warehouse = await this._repository.findById(id, organizationId);
    if (!warehouse) {
      throw new Error('Warehouse not found.') as Error & { code: string; statusCode: number };
    }

    await this._repository.softDelete(id, organizationId);
  }

  private toResponse(warehouse: {
    id: string;
    organizationId: string;
    branchId: string;
    code: string;
    name: string;
    description?: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): WarehouseResponse {
    return {
      id: warehouse.id,
      organizationId: warehouse.organizationId,
      branchId: warehouse.branchId,
      code: warehouse.code,
      name: warehouse.name,
      description: warehouse.description,
      isDefault: warehouse.isDefault,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    };
  }
}
