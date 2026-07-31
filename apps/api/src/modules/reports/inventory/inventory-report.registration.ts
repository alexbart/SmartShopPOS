import { reportRegistry } from '../../../shared/report-registry.js';
import type { ReportDefinition } from '../../../shared/report-registry.js';
import type {
  IInventoryReportRepository,
  StockReportFilters,
  StockReportItem,
  StockMovementFilters,
  StockMovementReportItem,
  LowStockFilters,
  LowStockItem,
  OutOfStockFilters,
  OutOfStockItem,
} from './repository/inventory-report.repository.js';
import type { ReportPaginatedResponse } from '../../../../shared/types/report-filter.js';

export class StockReportDefinition implements ReportDefinition<
  StockReportFilters,
  ReportPaginatedResponse<StockReportItem>
> {
  name = 'inventory';
  title = 'Inventory Stock Report';
  columns = [
    { key: 'productId', label: 'Product ID' },
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'available', label: 'Available' },
    { key: 'unit', label: 'Unit' },
  ];

  constructor(private readonly _repository: IInventoryReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(filters: StockReportFilters): Promise<ReportPaginatedResponse<StockReportItem>> {
    return this._repository.getCurrentStock(filters);
  }
}

export class StockMovementReportDefinition implements ReportDefinition<
  StockMovementFilters,
  ReportPaginatedResponse<StockMovementReportItem>
> {
  name = 'stock-movements';
  title = 'Stock Movements Report';
  columns = [
    { key: 'date', label: 'Date' },
    { key: 'product', label: 'Product' },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'balanceAfter', label: 'Balance After' },
    { key: 'referenceType', label: 'Reference Type' },
    { key: 'referenceNumber', label: 'Reference' },
    { key: 'performedBy', label: 'Performed By' },
  ];

  constructor(private readonly _repository: IInventoryReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(
    filters: StockMovementFilters,
  ): Promise<ReportPaginatedResponse<StockMovementReportItem>> {
    return this._repository.getStockMovements(filters);
  }
}

export class LowStockReportDefinition implements ReportDefinition<
  LowStockFilters,
  ReportPaginatedResponse<LowStockItem>
> {
  name = 'low-stock';
  title = 'Low Stock Report';
  columns = [
    { key: 'productId', label: 'Product ID' },
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'lowStockThreshold', label: 'Threshold' },
    { key: 'unit', label: 'Unit' },
  ];

  constructor(private readonly _repository: IInventoryReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(filters: LowStockFilters): Promise<ReportPaginatedResponse<LowStockItem>> {
    return this._repository.getLowStock(filters);
  }
}

export class OutOfStockReportDefinition implements ReportDefinition<
  OutOfStockFilters,
  ReportPaginatedResponse<OutOfStockItem>
> {
  name = 'out-of-stock';
  title = 'Out of Stock Report';
  columns = [
    { key: 'productId', label: 'Product ID' },
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit', label: 'Unit' },
  ];

  constructor(private readonly _repository: IInventoryReportRepository) {}
  // eslint-disable-next-line no-unused-vars
  async execute(filters: OutOfStockFilters): Promise<ReportPaginatedResponse<OutOfStockItem>> {
    return this._repository.getOutOfStock(filters);
  }
}

export function registerInventoryReports(repository: IInventoryReportRepository) {
  reportRegistry.register(new StockReportDefinition(repository));
  reportRegistry.register(new StockMovementReportDefinition(repository));
  reportRegistry.register(new LowStockReportDefinition(repository));
  reportRegistry.register(new OutOfStockReportDefinition(repository));
}
