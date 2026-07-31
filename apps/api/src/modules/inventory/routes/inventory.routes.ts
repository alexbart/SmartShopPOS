import { FastifyPluginAsync } from 'fastify';
import { GoodsReceivingController } from './controllers/goods-receiving.controller.js';
import { InventoryController } from './controllers/inventory.controller.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const inventoryRoutes: FastifyPluginAsync = async (fastify) => {
  const goodsReceivingController = new GoodsReceivingController();
  const inventoryController = new InventoryController();
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.post('/receive', { preHandler: [authenticateHook] }, async (request, reply) =>
    goodsReceivingController.receiveGoods(request, reply),
  );

  fastify.post('/sale', { preHandler: [authenticateHook] }, async (request, reply) =>
    goodsReceivingController.recordSale(request, reply),
  );

  fastify.post('/return', { preHandler: [authenticateHook] }, async (request, reply) =>
    goodsReceivingController.recordReturn(request, reply),
  );

  fastify.post('/adjust', { preHandler: [authenticateHook] }, async (request, reply) =>
    goodsReceivingController.adjustStock(request, reply),
  );

  fastify.post('/transfer', { preHandler: [authenticateHook] }, async (request, reply) =>
    goodsReceivingController.transferStock(request, reply),
  );

  fastify.get(
    '/warehouses/:warehouseId/stock',
    { preHandler: [authenticateHook] },
    async (request, reply) => inventoryController.listStock(request, reply),
  );

  fastify.get(
    '/warehouses/:warehouseId/products/:productId/stock',
    { preHandler: [authenticateHook] },
    async (request, reply) => inventoryController.getStockLevel(request, reply),
  );
};
