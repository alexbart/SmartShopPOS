import type { ICategoryRepository } from '../repositories/category.repository.js';
import type { CreateCategoryCommand } from '../commands/create-category.command.js';
import type { UpdateCategoryCommand } from '../commands/update-category.command.js';
import type { CategoryQuery } from '../repositories/category.repository.js';
import type { CategoryResponse } from '../responses/category.response.js';
import type { CategoryListResponse } from '../responses/category-list.response.js';
import { BaseService } from '../../../shared/services/base.service.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/business-error.js';

export class CategoryService extends BaseService<ICategoryRepository> {
  constructor(repository: ICategoryRepository) {
    super(repository);
  }

  async create(command: CreateCategoryCommand): Promise<CategoryResponse> {
    const existingByCode = await this._repository.findByCode(command.code, command.organizationId);
    if (existingByCode) {
      throw new ConflictError('Category code already exists.');
    }

    return (await super.create(command)) as CategoryResponse;
  }

  async update(command: UpdateCategoryCommand): Promise<CategoryResponse> {
    const existing = await this._repository.findById(command.id, command.organizationId);
    if (!existing) {
      throw new NotFoundError('Category not found.');
    }

    if (command.code && command.code !== existing.code) {
      const duplicate = await this._repository.findByCode(command.code, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new ConflictError('Category code already exists.');
      }
    }

    return (await super.update(command)) as CategoryResponse;
  }

  async findAll(query: CategoryQuery): Promise<CategoryListResponse> {
    const { items, total } = await this._repository.findAll(query);

    return {
      items: items.map((category) => this.toResponse(category)),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  protected toResponse(entity: unknown): CategoryResponse {
    const category = entity as {
      id: string;
      organizationId: string;
      name: string;
      code: string;
      description?: string;
      color?: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    return {
      id: category.id,
      organizationId: category.organizationId,
      name: category.name,
      code: category.code,
      description: category.description,
      color: category.color,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
