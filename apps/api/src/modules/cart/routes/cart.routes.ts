import { FastifyPluginAsync } from 'fastify';
import { CartController } from '../controllers/cart.controller.js';
import { CartService } from '../service/cart.service.js';
import { CartRepositoryImpl } from '../repositories/cart.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const cartRoutes: FastifyPluginAsync = async (fastify) => {
  const cartRepository = new CartRepositoryImpl(prisma);
  const cartService = new CartService(cartRepository);
  const cartController = new CartController(cartService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    cartController.create(request, reply),
  );
  fastify.get('/:cartId', { preHandler: [authenticateHook] }, async (request, reply) =>
    cartController.getById(request, reply),
  );
  fastify.post('/:cartId/items', { preHandler: [authenticateHook] }, async (request, reply) =>
    cartController.addItem(request, reply),
  );
  fastify.delete('/:cartId/items/:itemId', { preHandler: [authenticateHook] }, async (request, reply) =>
    cartController.removeItem(request, reply),
  );
  fastify.patch('/:cartId/items/:itemId', { preHandler: [authenticateHook] }, async (request, reply) =>
    cartController.updateItem(request, reply),
  );
};
