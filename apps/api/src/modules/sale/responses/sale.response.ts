export interface SaleItemResponse {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface SaleResponse {
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
  items: SaleItemResponse[];
}
