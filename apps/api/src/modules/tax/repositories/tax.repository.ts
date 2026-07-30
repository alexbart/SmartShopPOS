export interface ITaxRepository {
  create(_model: CreateTaxModel): Promise<string>;
  update(_model: UpdateTaxModel): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<TaxEntity | null>;
  findByCode(_code: string, _organizationId: string): Promise<TaxEntity | null>;
  findAll(_query: TaxQuery): Promise<{ items: TaxEntity[]; total: number }>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}

export interface CreateTaxModel {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  rate: number;
  createdBy?: string;
}

export interface UpdateTaxModel {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  rate?: number;
  isActive?: boolean;
  updatedBy?: string;
}

export interface TaxQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaxEntity {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  rate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
