import type { ICartRepository } from '../repositories/cart.repository.js';
import type { CreateCartCommand } from '../commands/create-cart.command.js';
import type { AddCartItemCommand, RemoveCartItemCommand, UpdateCartItemCommand } from '../commands/cart-item.commands.js';
import type { CartResponse } from '../responses/cart.response.js';

export class CartService {
  constructor(private readonly _repository: ICartRepository) {}

  async create(command: CreateCartCommand): Promise<CartResponse> {
    const id = await this._repository.create(command);
    const cart = await this._repository.findById(id, command.organizationId);
    if (!cart) {
      throw new Error('Cart not found after creation.') as Error & { code: string; statusCode: number };
    }
    return this.toResponse(cart);
  }

  async addItem(command: AddCartItemCommand, organizationId: string): Promise<CartResponse> {
    await this._repository.addItem(command);
    const cart = await this._repository.findById(command.cartId, organizationId);
    if (!cart) {
      throw new Error('Cart not found.') as Error & { code: string; statusCode: number };
    }
    return this.toResponse(cart);
  }

  async removeItem(command: RemoveCartItemCommand): Promise<void> {
    await this._repository.removeItem(command.itemId);
  }

  async updateItem(command: UpdateCartItemCommand): Promise<void> {
    await this._repository.updateItem({
      cartItemId: command.itemId,
      quantity: command.quantity,
      price: command.price,
    });
  }

  async getById(id: string, organizationId: string): Promise<CartResponse> {
    const cart = await this._repository.findById(id, organizationId);
    if (!cart) {
      throw new Error('Cart not found.') as Error & { code: string; statusCode: number };
    }
    return this.toResponse(cart);
  }

  async clearItems(cartId: string): Promise<void> {
    await this._repository.clearItems(cartId);
  }

  private toResponse(cart: {
    id: string;
    organizationId: string;
    warehouseId: string;
    customerId?: string;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      price: number;
      createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): CartResponse {
    if (!cart) {
      throw new Error('Cart not found.') as Error & { code: string; statusCode: number };
    }
    return {
      id: cart.id,
      organizationId: cart.organizationId,
      warehouseId: cart.warehouseId,
      customerId: cart.customerId,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        createdAt: item.createdAt,
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
