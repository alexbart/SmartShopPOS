export interface UpdateProductDto {
  name?: string;
  code?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  taxId?: string;
  costPrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
}
