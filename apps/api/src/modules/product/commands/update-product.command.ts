export interface UpdateProductCommand {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string | null;
  brandId?: string | null;
  unitId?: string;
  taxId?: string | null;
  costPrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
  updatedBy?: string;
}
