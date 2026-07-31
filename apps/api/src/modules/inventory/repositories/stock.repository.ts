export interface IStockRepository {
  createOrGet(_model: {
    organizationId: string;
    warehouseId: string;
    productId: string;
  }): Promise<string>;
  updateQuantity(_stockId: string, _quantity: number, _reservedQuantity: number): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<StockEntity | null>;
  findByWarehouseAndProduct(
    _warehouseId: string,
    _productId: string,
    _organizationId: string,
  ): Promise<StockEntity | null>;
  findAllByWarehouse(_warehouseId: string, _organizationId: string): Promise<StockEntity[]>;
}

export interface StockEntity {
  id: string;
  organizationId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt: Date;
}
