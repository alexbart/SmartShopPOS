import type { IBrandRepository } from '../repositories/brand.repository.js';
import type { CreateBrandCommand } from '../commands/create-brand.command.js';
import type { UpdateBrandCommand } from '../commands/update-brand.command.js';
import type { BrandQuery } from '../repositories/brand.repository.js';
import type { BrandResponse } from '../responses/brand.response.js';
import type { BrandListResponse } from '../responses/brand-list.response.js';

export class BrandService {
  constructor(private readonly _repository: IBrandRepository) {}

  async create(command: CreateBrandCommand): Promise<BrandResponse> {
    const existingByCode = await this._repository.findByCode(command.code, command.organizationId);
    if (existingByCode) {
      throw new Error('Brand code already exists.') as Error & { code: string; statusCode: number };
    }

    const existingByName = await this._repository.findByCode(command.name, command.organizationId);
    if (existingByName) {
      throw new Error('Brand name already exists.') as Error & { code: string; statusCode: number };
    }

    const id = await this._repository.create(command);

    const brand = await this._repository.findById(id, command.organizationId);
    if (!brand) {
      throw new Error('Brand not found after creation.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(brand);
  }

  async update(command: UpdateBrandCommand): Promise<BrandResponse> {
    const existing = await this._repository.findById(command.id, command.organizationId);
    if (!existing) {
      throw new Error('Brand not found.') as Error & { code: string; statusCode: number };
    }

    if (command.code && command.code !== existing.code) {
      const duplicate = await this._repository.findByCode(command.code, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Brand code already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    if (command.name && command.name !== existing.name) {
      const duplicate = await this._repository.findByCode(command.name, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Brand name already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    await this._repository.update(command);

    const updated = await this._repository.findById(command.id, command.organizationId);
    if (!updated) {
      throw new Error('Brand not found after update.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(updated);
  }

  async findById(id: string, organizationId: string): Promise<BrandResponse> {
    const brand = await this._repository.findById(id, organizationId);
    if (!brand) {
      throw new Error('Brand not found.') as Error & { code: string; statusCode: number };
    }

    return this.toResponse(brand);
  }

  async findAll(query: BrandQuery): Promise<BrandListResponse> {
    const { items, total } = await this._repository.findAll(query);

    return {
      items: items.map((brand) => this.toResponse(brand)),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const brand = await this._repository.findById(id, organizationId);
    if (!brand) {
      throw new Error('Brand not found.') as Error & { code: string; statusCode: number };
    }

    await this._repository.softDelete(id, organizationId);
  }

  private toResponse(brand: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BrandResponse {
    return {
      id: brand.id,
      organizationId: brand.organizationId,
      name: brand.name,
      code: brand.code,
      description: brand.description,
      logoUrl: brand.logoUrl,
      website: brand.website,
      isActive: brand.isActive,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }
}
