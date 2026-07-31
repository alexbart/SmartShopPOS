export interface CartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface CartResponse {
  id: string;
  organizationId: string;
  warehouseId: string;
  customerId?: string;
  items: CartItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}
