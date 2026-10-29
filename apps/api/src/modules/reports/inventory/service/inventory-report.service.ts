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
} from '../repository/inventory-report.repository.js';

export class InventoryReportService {
  constructor(private readonly _repository: IInventoryReportRepository) {}

  async getCurrentStock(
    filters: StockReportFilters,
  ): Promise<{ items: StockReportItem[]; pagination: Record<string, number> }> {
    const result = await this._repository.getCurrentStock(filters);
    return {
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getStockMovements(
    filters: StockMovementFilters,
  ): Promise<{ items: StockMovementReportItem[]; pagination: Record<string, number> }> {
    const result = await this._repository.getStockMovements(filters);
    return {
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getLowStock(
    filters: LowStockFilters,
  ): Promise<{ items: LowStockItem[]; pagination: Record<string, number> }> {
    const result = await this._repository.getLowStock(filters);
    return {
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getOutOfStock(
    filters: OutOfStockFilters,
  ): Promise<{ items: OutOfStockItem[]; pagination: Record<string, number> }> {
    const result = await this._repository.getOutOfStock(filters);
    return {
      items: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
}
