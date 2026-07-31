import { PrismaClient } from '@prisma/client';
import type { ICartRepository } from './cart.repository.js';

export class CartRepositoryImpl implements ICartRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<ICartRepository['create']>[0]) {
    const cart = await this._prisma.cart.create({
      data: {
        organizationId: _model.organizationId,
        warehouseId: _model.warehouseId,
        customerId: _model.customerId,
      },
      select: { id: true },
    });

    return cart.id;
  }

  async addItem(_model: Parameters<ICartRepository['addItem']>[0]) {
    const item = await this._prisma.cartItem.create({
      data: {
        cartId: _model.cartId,
        productId: _model.productId,
        quantity: _model.quantity,
        price: _model.price,
      },
      select: { id: true },
    });

    return item.id;
  }

  async removeItem(_cartItemId: string) {
    await this._prisma.cartItem.delete({
      where: { id: _cartItemId },
    });
  }

  async updateItem(_model: Parameters<ICartRepository['updateItem']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.quantity !== undefined) data.quantity = _model.quantity;
    if (_model.price !== undefined) data.price = _model.price;

    await this._prisma.cartItem.update({
      where: { id: _model.cartItemId },
      data,
    });
  }

  async findById(_id: string, _organizationId: string) {
    const cart = await this._prisma.cart.findFirst({
      where: { id: _id, organizationId: _organizationId },
      include: {
        items: {
          select: {
            id: true,
            cartId: true,
            productId: true,
            quantity: true,
            price: true,
            createdAt: true,
          },
        },
      },
    });

    if (!cart) return null;

    return {
      id: cart.id,
      organizationId: cart.organizationId,
      warehouseId: cart.warehouseId,
      customerId: cart.customerId ?? undefined,
      items: cart.items.map((item) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        createdAt: item.createdAt,
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async findActiveByWarehouse(_warehouseId: string, _organizationId: string) {
    const cart = await this._prisma.cart.findFirst({
      where: {
        warehouseId: _warehouseId,
        organizationId: _organizationId,
        items: {
          some: {},
        },
      },
      include: {
        items: {
          select: {
            id: true,
            cartId: true,
            productId: true,
            quantity: true,
            price: true,
            createdAt: true,
          },
        },
      },
    });

    if (!cart) return null;

    return {
      id: cart.id,
      organizationId: cart.organizationId,
      warehouseId: cart.warehouseId,
      customerId: cart.customerId ?? undefined,
      items: cart.items.map((item) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        createdAt: item.createdAt,
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async clearItems(_cartId: string) {
    await this._prisma.cartItem.deleteMany({
      where: { cartId: _cartId },
    });
  }
}
