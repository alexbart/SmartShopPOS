export interface ICustomerRepository {
  create(_model: CreateCustomerModel): Promise<string>;
  update(_model: UpdateCustomerModel): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<CustomerEntity | null>;
  findByCode(_code: string, _organizationId: string): Promise<CustomerEntity | null>;
  findAll(_query: CustomerQuery): Promise<{ items: CustomerEntity[]; total: number }>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}

export interface CreateCustomerModel {
  organizationId: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  taxPin?: string;
  address?: string;
  creditLimit?: number;
}

export interface UpdateCustomerModel {
  id: string;
  organizationId: string;
  code?: string;
  name?: string;
  phone?: string;
  email?: string;
  taxPin?: string;
  address?: string;
  creditLimit?: number;
  isActive?: boolean;
}

export interface CustomerQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerEntity {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  taxPin?: string;
  address?: string;
  loyaltyPoints: number;
  creditLimit?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
