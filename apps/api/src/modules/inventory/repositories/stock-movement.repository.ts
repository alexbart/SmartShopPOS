export interface IStockMovementRepository {
  create(_model: CreateStockMovementModel): Promise<string>;
  findById(_id: string, _organizationId: string): Promise<StockMovementEntity | null>;
  findAll(_query: StockMovementQuery): Promise<{ items: StockMovementEntity[]; total: number }>;
}

export interface CreateStockMovementModel {
  organizationId: string;
  warehouseId: string;
  productId: string;
  stockId: string;
  type: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  remarks?: string;
}

export interface StockMovementQuery {
  organizationId: string;
  page: number;
  limit: number;
  warehouseId?: string;
  productId?: string;
  type?: StockMovementType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type StockMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'EXPIRED';

export interface StockMovementEntity {
  id: string;
  organizationId: string;
  warehouseId: string;
  productId: string;
  stockId: string;
  type: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  remarks?: string;
  createdAt: Date;
}
