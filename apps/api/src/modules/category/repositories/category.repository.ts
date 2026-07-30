import type { IRepository } from '../../../shared/repositories/base.repository.js';

export interface ICategoryRepository extends IRepository<CategoryEntity> {
  findByCode(_code: string, _organizationId: string): Promise<CategoryEntity | null>;
}

export interface CreateCategoryModel {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  createdBy?: string;
}

export interface UpdateCategoryModel {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface CategoryQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryEntity {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
