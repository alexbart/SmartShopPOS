export interface IBrandRepository {
  create(_model: CreateBrandModel): Promise<string>;
  update(_model: UpdateBrandModel): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<BrandEntity | null>;
  findByCode(_code: string, _organizationId: string): Promise<BrandEntity | null>;
  findAll(_query: BrandQuery): Promise<BrandEntity[]>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}

export interface CreateBrandModel {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  createdBy?: string;
}

export interface UpdateBrandModel {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface BrandQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BrandEntity {
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
}
