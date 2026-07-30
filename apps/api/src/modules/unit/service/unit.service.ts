import type { IUnitRepository } from '../repositories/unit.repository.js';
import type { CreateUnitCommand } from '../commands/create-unit.command.js';
import type { UpdateUnitCommand } from '../commands/update-unit.command.js';
import type { UnitQuery } from '../repositories/unit.repository.js';
import type { UnitResponse } from '../responses/unit.response.js';
import type { UnitListResponse } from '../responses/unit-list.response.js';

export class UnitService {
  constructor(private readonly _repository: IUnitRepository) {}

  async create(command: CreateUnitCommand): Promise<UnitResponse> {
    const existingByCode = await this._repository.findByCode(command.code, command.organizationId);
    if (existingByCode) {
      throw new Error('Unit code already exists.') as Error & { code: string; statusCode: number };
    }

    const existingByName = await this._repository.findByCode(command.name, command.organizationId);
    if (existingByName) {
      throw new Error('Unit name already exists.') as Error & { code: string; statusCode: number };
    }

    const id = await this._repository.create(command);

    const unit = await this._repository.findById(id, command.organizationId);
    if (!unit) {
      throw new Error('Unit not found after creation.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(unit);
  }

  async update(command: UpdateUnitCommand): Promise<UnitResponse> {
    const existing = await this._repository.findById(command.id, command.organizationId);
    if (!existing) {
      throw new Error('Unit not found.') as Error & { code: string; statusCode: number };
    }

    if (command.code && command.code !== existing.code) {
      const duplicate = await this._repository.findByCode(command.code, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Unit code already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    if (command.name && command.name !== existing.name) {
      const duplicate = await this._repository.findByCode(command.name, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Unit name already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    await this._repository.update(command);

    const updated = await this._repository.findById(command.id, command.organizationId);
    if (!updated) {
      throw new Error('Unit not found after update.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(updated);
  }

  async findById(id: string, organizationId: string): Promise<UnitResponse> {
    const unit = await this._repository.findById(id, organizationId);
    if (!unit) {
      throw new Error('Unit not found.') as Error & { code: string; statusCode: number };
    }

    return this.toResponse(unit);
  }

  async findAll(query: UnitQuery): Promise<UnitListResponse> {
    const { items, total } = await this._repository.findAll(query);

    return {
      items: items.map((unit) => this.toResponse(unit)),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const unit = await this._repository.findById(id, organizationId);
    if (!unit) {
      throw new Error('Unit not found.') as Error & { code: string; statusCode: number };
    }

    await this._repository.softDelete(id, organizationId);
  }

  private toResponse(unit: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description?: string;
    abbreviation?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UnitResponse {
    return {
      id: unit.id,
      organizationId: unit.organizationId,
      name: unit.name,
      code: unit.code,
      description: unit.description,
      abbreviation: unit.abbreviation,
      isActive: unit.isActive,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }
}
