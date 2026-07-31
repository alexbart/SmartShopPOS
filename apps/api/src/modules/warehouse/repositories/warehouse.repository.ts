export interface IWarehouseRepository {
  create(_model: CreateWarehouseModel): Promise<string>;
  update(_model: UpdateWarehouseModel): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<WarehouseEntity | null>;
  findByCode(_code: string, _organizationId: string): Promise<WarehouseEntity | null>;
  findAll(_query: WarehouseQuery): Promise<{ items: WarehouseEntity[]; total: number }>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}

export interface CreateWarehouseModel {
  organizationId: string;
  branchId: string;
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateWarehouseModel {
  id: string;
  organizationId: string;
  code?: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface WarehouseQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface WarehouseEntity {
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
}
