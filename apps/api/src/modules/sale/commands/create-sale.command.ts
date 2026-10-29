export interface CreateSaleItemCommand {
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;
}

export interface CreateSaleCommand {
  organizationId: string;
  warehouseId: string;
  cashierId: string;
  customerId?: string;
  items: CreateSaleItemCommand[];
  discount?: number;
  tax?: number;
}
