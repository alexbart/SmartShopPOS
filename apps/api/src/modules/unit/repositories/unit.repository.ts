export interface IUnitRepository {
  create(_model: CreateUnitModel): Promise<string>;
  update(_model: UpdateUnitModel): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<UnitEntity | null>;
  findByCode(_code: string, _organizationId: string): Promise<UnitEntity | null>;
  findAll(_query: UnitQuery): Promise<{ items: UnitEntity[]; total: number }>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}

export interface CreateUnitModel {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  abbreviation?: string;
  createdBy?: string;
}

export interface UpdateUnitModel {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  abbreviation?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface UnitQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UnitEntity {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  abbreviation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
