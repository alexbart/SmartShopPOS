export interface ICartRepository {
  create(_model: CreateCartModel): Promise<string>;
  addItem(_model: AddCartItemModel): Promise<string>;
  removeItem(_cartItemId: string): Promise<void>;
  updateItem(_model: UpdateCartItemModel): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<CartEntity | null>;
  findActiveByWarehouse(_warehouseId: string, _organizationId: string): Promise<CartEntity | null>;
  clearItems(_cartId: string): Promise<void>;
}

export interface CreateCartModel {
  organizationId: string;
  warehouseId: string;
  customerId?: string;
}

export interface AddCartItemModel {
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface UpdateCartItemModel {
  cartItemId: string;
  quantity?: number;
  price?: number;
}

export interface CartItemEntity {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface CartEntity {
  id: string;
  organizationId: string;
  warehouseId: string;
  customerId?: string;
  items: CartItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}
