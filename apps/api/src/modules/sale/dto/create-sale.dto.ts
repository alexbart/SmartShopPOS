export interface CreateSaleDto {
  warehouseId: string;
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    discount?: number;
    tax?: number;
  }>;
  discount?: number;
  tax?: number;
}
