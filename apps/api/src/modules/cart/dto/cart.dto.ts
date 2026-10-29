export interface CreateCartDto {
  warehouseId: string;
  customerId?: string;
}

export interface AddCartItemDto {
  productId: string;
  quantity: number;
  price: number;
}

export interface UpdateCartItemDto {
  quantity?: number;
  price?: number;
}
