export interface ProductResponse {
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
  stockQuantity: number;
  lowStockThreshold?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
