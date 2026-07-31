export interface StockReportDto {
  warehouseId?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  search?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface StockMovementDto {
  from?: Date;
  to?: Date;
  warehouseId?: string;
  productId?: string;
  movementType?: string;
  performedBy?: string;
  page?: number;
  limit?: number;
}

export interface LowStockDto {
  warehouseId?: string;
  categoryId?: string;
  brandId?: string;
  page?: number;
  limit?: number;
}

export interface OutOfStockDto {
  warehouseId?: string;
  categoryId?: string;
  brandId?: string;
  page?: number;
  limit?: number;
}
