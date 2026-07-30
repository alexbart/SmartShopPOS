export interface IProductRepository {
  create(_model: CreateProductModel): Promise<string>;
  update(_model: UpdateProductModel): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<ProductEntity | null>;
  findByCode(_code: string, _organizationId: string): Promise<ProductEntity | null>;
  findBySku(_sku: string, _organizationId: string): Promise<ProductEntity | null>;
  findAll(_query: ProductQuery): Promise<{ items: ProductEntity[]; total: number }>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}

export interface CreateProductModel {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string;
  unitId: string;
  taxId?: string;
  costPrice: number;
  sellingPrice: number;
  createdBy?: string;
}

export interface UpdateProductModel {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  unitId?: string;
  taxId?: string | null;
  costPrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
  updatedBy?: string;
}

export interface ProductQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  categoryId?: string;
  brandId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductEntity {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  unitId: string;
  unitName?: string;
  unitAbbreviation?: string;
  taxId?: string;
  taxName?: string;
  taxRate?: number;
  costPrice: number;
  sellingPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
