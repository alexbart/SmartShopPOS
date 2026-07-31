export interface AddCartItemCommand {
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface RemoveCartItemCommand {
  cartId: string;
  itemId: string;
}

export interface UpdateCartItemCommand {
  cartId: string;
  itemId: string;
  quantity?: number;
  price?: number;
}
