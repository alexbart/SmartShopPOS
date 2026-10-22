import { FastifyPluginAsync } from 'fastify';
import { GoodsReceivingController } from '../controllers/goods-receiving.controller.js';
import { InventoryController } from '../controllers/inventory.controller.js';
import {
  createAuthenticateHook,
  createAuthorizeHook,
} from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { getPrisma } from '../../../shared/database/prisma.js';

const prisma = getPrisma();

export const inventoryRoutes: FastifyPluginAsync = async (fastify) => {
  const goodsReceivingController = new GoodsReceivingController();
  const inventoryController = new InventoryController();
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);
  const authorizeAdjust = createAuthorizeHook(['inventory:adjust']);
  const authorizeRead = createAuthorizeHook(['inventory:read']);
  const authorizeTransfer = createAuthorizeHook(['inventory:transfer']);

  fastify.post(
    '/receive',
    { preHandler: [authenticateHook, authorizeAdjust] },
    async (request, reply) => goodsReceivingController.receiveGoods(request, reply),
  );

  fastify.post(
    '/sale',
    { preHandler: [authenticateHook, authorizeAdjust] },
    async (request, reply) => goodsReceivingController.recordSale(request, reply),
  );

  fastify.post(
    '/return',
    { preHandler: [authenticateHook, authorizeAdjust] },
    async (request, reply) => goodsReceivingController.recordReturn(request, reply),
  );

  fastify.post('/adjust', {
    preHandler: [authenticateHook, authorizeAdjust],
    schema: {
      tags: ['inventory'],
      description: 'Adjust stock quantity',
      summary: 'Adjust Stock',
      consumes: ['application/json'],
      produces: ['application/json'],
      body: {
        type: 'object',
        required: ['warehouseId', 'productId', 'quantity', 'type', 'remarks'],
        properties: {
          warehouseId: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          quantity: {
            type: 'integer',
            minimum: -999999,
            maximum: 999999,
            description: 'Adjustment quantity (non-zero, can be negative)',
          },
          type: { type: 'string', enum: ['ADJUSTMENT', 'DAMAGE', 'EXPIRED'] },
          remarks: { type: 'string', minLength: 3, maxLength: 500 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Stock adjustment recorded successfully.' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => goodsReceivingController.adjustStock(request, reply),
  });

  fastify.post(
    '/transfer',
    { preHandler: [authenticateHook, authorizeTransfer] },
    async (request, reply) => goodsReceivingController.transferStock(request, reply),
  );

  fastify.get(
    '/warehouses/:warehouseId/stock',
    { preHandler: [authenticateHook, authorizeRead] },
    async (request, reply) => inventoryController.listStock(request, reply),
  );

  fastify.get(
    '/warehouses/:warehouseId/products/:productId/stock',
    { preHandler: [authenticateHook, authorizeRead] },
    async (request, reply) => inventoryController.getStockLevel(request, reply),
  );

  fastify.get(
    '/movements',
    { preHandler: [authenticateHook, authorizeRead] },
    async (request, reply) => inventoryController.listMovements(request, reply),
  );
};
