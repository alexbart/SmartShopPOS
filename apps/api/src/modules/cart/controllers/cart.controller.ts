import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CartService } from '../service/cart.service.js';

export class CartController {
  constructor(private readonly _cartService: CartService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { warehouseId: string; customerId?: string };

    const cart = await this._cartService.create({
      organizationId: request.requestContext.organizationId,
      warehouseId: body.warehouseId,
      customerId: body.customerId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Cart created successfully.',
      data: cart,
    });
  }

  async addItem(request: FastifyRequest, reply: FastifyReply) {
    const { cartId } = request.params as { cartId: string };
    const body = request.body as { productId: string; quantity: number; price: number };

    const cart = await this._cartService.addItem(
      {
        cartId,
        productId: body.productId,
        quantity: body.quantity,
        price: body.price,
      },
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Item added to cart successfully.',
      data: cart,
    });
  }

  async removeItem(request: FastifyRequest, reply: FastifyReply) {
    const { cartId, itemId } = request.params as { cartId: string; itemId: string };

    await this._cartService.removeItem({ cartId, itemId });

    return reply.status(204).send();
  }

  async updateItem(request: FastifyRequest, reply: FastifyReply) {
    const { cartId, itemId } = request.params as { cartId: string; itemId: string };
    const body = request.body as { quantity?: number; price?: number };

    await this._cartService.updateItem({
      cartId,
      itemId,
      quantity: body.quantity,
      price: body.price,
    });

    return reply.status(200).send({
      success: true,
      message: 'Cart item updated successfully.',
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { cartId } = request.params as { cartId: string };

    const cart = await this._cartService.getById(cartId, request.requestContext.organizationId);

    return reply.status(200).send({
      success: true,
      message: 'Cart retrieved successfully.',
      data: cart,
    });
  }
}
