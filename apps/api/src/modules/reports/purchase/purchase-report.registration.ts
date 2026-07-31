import { reportRegistry } from '../../../shared/report-registry.js';
import type { ReportDefinition, ReportColumn } from '../../../shared/report-registry.js';
import type {
  IPurchaseReportRepository,
  PurchaseReportFilters,
  PurchaseReportItem,
  TopSupplierItem,
  OutstandingOrderItem,
  LateDeliveryItem,
} from './repository/purchase-report.repository.js';
import type { ReportPaginatedResponse } from '../../../shared/types/report-filter.js';

export class PurchaseSummaryReportDefinition implements ReportDefinition<
  PurchaseReportFilters,
  ReportPaginatedResponse<PurchaseReportItem>
> {
  name = 'purchases';
  title = 'Purchase Summary Report';
  columns: ReportColumn[] = [
    { key: 'purchaseOrderNumber', label: 'Order #' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'total', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Date' },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery' },
  ];

  constructor(private readonly _repository: IPurchaseReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(
    filters: PurchaseReportFilters,
  ): Promise<ReportPaginatedResponse<PurchaseReportItem>> {
    return this._repository.getPurchaseSummary(filters);
  }
}

export class TopSuppliersReportDefinition implements ReportDefinition<
  PurchaseReportFilters,
  TopSupplierItem[]
> {
  name = 'top-suppliers';
  title = 'Top Suppliers Report';
  columns: ReportColumn[] = [
    { key: 'supplierId', label: 'Supplier ID' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'totalSpent', label: 'Total Spent' },
    { key: 'orderCount', label: 'Orders' },
  ];

  constructor(private readonly _repository: IPurchaseReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(filters: PurchaseReportFilters): Promise<TopSupplierItem[]> {
    return this._repository.getTopSuppliers(filters);
  }
}

export class OutstandingOrdersReportDefinition implements ReportDefinition<
  PurchaseReportFilters,
  ReportPaginatedResponse<OutstandingOrderItem>
> {
  name = 'outstanding-orders';
  title = 'Outstanding Purchase Orders';
  columns: ReportColumn[] = [
    { key: 'purchaseOrderId', label: 'Order ID' },
    { key: 'orderNumber', label: 'Order #' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'total', label: 'Total' },
    { key: 'receivedQuantity', label: 'Received' },
    { key: 'totalQuantity', label: 'Ordered' },
    { key: 'pendingAmount', label: 'Pending Amount' },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery' },
  ];

  constructor(private readonly _repository: IPurchaseReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(
    filters: PurchaseReportFilters,
  ): Promise<ReportPaginatedResponse<OutstandingOrderItem>> {
    return this._repository.getOutstandingOrders(filters);
  }
}

export class LateDeliveriesReportDefinition implements ReportDefinition<
  PurchaseReportFilters,
  LateDeliveryItem[]
> {
  name = 'late-deliveries';
  title = 'Late Deliveries Report';
  columns: ReportColumn[] = [
    { key: 'purchaseOrderId', label: 'Order ID' },
    { key: 'orderNumber', label: 'Order #' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'expectedDeliveryDate', label: 'Expected' },
    { key: 'daysLate', label: 'Days Late' },
    { key: 'total', label: 'Amount' },
  ];

  constructor(private readonly _repository: IPurchaseReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(filters: PurchaseReportFilters): Promise<LateDeliveryItem[]> {
    return this._repository.getLateDeliveries(filters);
  }
}

export function registerPurchaseReports(repository: IPurchaseReportRepository) {
  reportRegistry.register(new PurchaseSummaryReportDefinition(repository));
  reportRegistry.register(new TopSuppliersReportDefinition(repository));
  reportRegistry.register(new OutstandingOrdersReportDefinition(repository));
  reportRegistry.register(new LateDeliveriesReportDefinition(repository));
}
