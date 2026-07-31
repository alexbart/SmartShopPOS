export interface SaleStatus {
  PENDING: 'PENDING';
  COMPLETED: 'COMPLETED';
  VOIDED: 'VOIDED';
  REFUNDED: 'REFUNDED';
}

export interface ISaleRepository {
  create(_model: CreateSaleModel): Promise<string>;
  createItems(_saleId: string, _items: CreateSaleItemModel[]): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<SaleEntity | null>;
  findByNumber(_number: string, _organizationId: string): Promise<SaleEntity | null>;
  updateStatus(_id: string, _status: string): Promise<void>;
  void(_id: string): Promise<void>;
}

export interface CreateSaleModel {
  organizationId: string;
  number: string;
  warehouseId: string;
  cashierId: string;
  customerId?: string;
  items: CreateSaleItemModel[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
}

export interface CreateSaleItemModel {
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface SaleItemEntity {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface SaleEntity {
  id: string;
  organizationId: string;
  number: string;
  customerId?: string;
  warehouseId: string;
  cashierId: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: SaleItemEntity[];
}
