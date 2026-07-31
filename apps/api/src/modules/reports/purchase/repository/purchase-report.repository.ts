import type { ReportFilter, ReportPaginatedResponse } from '../../../shared/types/report-filter.js';

export interface PurchaseReportFilters extends ReportFilter {
  supplierId?: string;
  status?: string;
  from?: Date;
  to?: Date;
}

export interface PurchaseReportItem {
  purchaseOrderNumber: string;
  supplier: string;
  total: number;
  status: string;
  createdAt: Date;
  expectedDeliveryDate?: Date;
}

export interface PurchaseReportSummary {
  totalOrders: number;
  totalAmount: number;
  pendingAmount: number;
  receivedAmount: number;
}

export interface TopSupplierItem {
  supplierId: string;
  supplier: string;
  totalSpent: number;
  orderCount: number;
}

export interface OutstandingOrderItem {
  purchaseOrderId: string;
  orderNumber: string;
  supplier: string;
  total: number;
  receivedQuantity: number;
  totalQuantity: number;
  pendingAmount: number;
  expectedDeliveryDate?: Date;
}

export interface LateDeliveryItem {
  purchaseOrderId: string;
  orderNumber: string;
  supplier: string;
  expectedDeliveryDate: Date;
  daysLate: number;
  total: number;
}

export interface IPurchaseReportRepository {
  // eslint-disable-next-line no-unused-vars
  getPurchaseSummary(
    filters: PurchaseReportFilters,
  ): Promise<ReportPaginatedResponse<PurchaseReportItem>>;
  // eslint-disable-next-line no-unused-vars
  getPurchaseSummaryTotals(filters: PurchaseReportFilters): Promise<PurchaseReportSummary>;
  // eslint-disable-next-line no-unused-vars
  getTopSuppliers(filters: PurchaseReportFilters): Promise<TopSupplierItem[]>;
  // eslint-disable-next-line no-unused-vars
  getOutstandingOrders(
    filters: PurchaseReportFilters,
  ): Promise<ReportPaginatedResponse<OutstandingOrderItem>>;
  // eslint-disable-next-line no-unused-vars
  getLateDeliveries(filters: PurchaseReportFilters): Promise<LateDeliveryItem[]>;
}
