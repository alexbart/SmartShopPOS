import type { ReportFilter, ReportPaginatedResponse } from '../../../shared/types/report-filter.js';

export interface StockReportFilters extends ReportFilter {
  warehouseId?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  search?: string;
  activeOnly?: boolean;
}

export interface StockReportItem {
  productId: string;
  sku: string | null;
  name: string;
  warehouse: string;
  quantity: number;
  reserved: number;
  available: number;
  unit: string;
}

export interface StockMovementFilters extends ReportFilter {
  warehouseId?: string;
  productId?: string;
  movementType?: string;
  performedBy?: string;
}

export interface StockMovementReportItem {
  date: Date;
  product: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceNumber: string | null;
  performedBy: string | null;
}

export interface LowStockFilters extends ReportFilter {
  warehouseId?: string;
  categoryId?: string;
  brandId?: string;
}

export interface LowStockItem {
  productId: string;
  sku: string | null;
  name: string;
  warehouse: string;
  quantity: number;
  lowStockThreshold: number;
  unit: string;
}

export interface OutOfStockFilters extends ReportFilter {
  warehouseId?: string;
  categoryId?: string;
  brandId?: string;
}

export interface OutOfStockItem {
  productId: string;
  sku: string | null;
  name: string;
  warehouse: string;
  quantity: number;
  unit: string;
}

export interface IInventoryReportRepository {
  // eslint-disable-next-line no-unused-vars
  getCurrentStock(filters: StockReportFilters): Promise<ReportPaginatedResponse<StockReportItem>>;
  // eslint-disable-next-line no-unused-vars
  getStockMovements(
    filters: StockMovementFilters,
  ): Promise<ReportPaginatedResponse<StockMovementReportItem>>;
  // eslint-disable-next-line no-unused-vars
  getLowStock(filters: LowStockFilters): Promise<ReportPaginatedResponse<LowStockItem>>;
  // eslint-disable-next-line no-unused-vars
  getOutOfStock(filters: OutOfStockFilters): Promise<ReportPaginatedResponse<OutOfStockItem>>;
}
