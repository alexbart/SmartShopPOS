export interface ISupplierRepository {
  create(_model: CreateSupplierModel): Promise<string>;
  update(_model: UpdateSupplierModel): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<SupplierEntity | null>;
  findByCode(_code: string, _organizationId: string): Promise<SupplierEntity | null>;
  findAll(_query: SupplierQuery): Promise<{ items: SupplierEntity[]; total: number }>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}

export interface CreateSupplierModel {
  organizationId: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxPin?: string;
  creditLimit?: number;
  paymentTerms?: string;
}

export interface UpdateSupplierModel {
  id: string;
  organizationId: string;
  code?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxPin?: string;
  creditLimit?: number | null;
  paymentTerms?: string | null;
  isActive?: boolean;
}

export interface SupplierQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierEntity {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxPin?: string;
  creditLimit?: number;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
