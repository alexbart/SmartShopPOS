import { FastifyPluginAsync } from 'fastify';
import { PurchaseOrderController } from '../controller/purchase-order.controller.js';
import { PurchaseOrderService } from '../service/purchase-order.service.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { NumberSequenceService } from '../../../shared/services/number-sequence/number-sequence.service.js';
import { StockService } from '../../inventory/services/stock.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const unitOfWork = new UnitOfWork();
const numberSequenceService = new NumberSequenceService(prisma);
const stockService = new StockService(unitOfWork, prisma);

export const purchaseOrderRoutes: FastifyPluginAsync = async (fastify) => {
  const purchaseOrderService = new PurchaseOrderService(
    unitOfWork,
    numberSequenceService,
    prisma,
    stockService,
  );
  const purchaseOrderController = new PurchaseOrderController(purchaseOrderService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.post(
    '/',
    {
      preHandler,
      schema: {
        description: 'Create a new purchase order',
        tags: ['Purchase Orders'],
        summary: 'Create Purchase Order',
      },
    },
    async (request, reply) => purchaseOrderController.create(request, reply),
  );

  fastify.get(
    '/',
    {
      preHandler,
      schema: {
        description: 'List purchase orders for the organization',
        tags: ['Purchase Orders'],
        summary: 'List Purchase Orders',
      },
    },
    async (request, reply) => purchaseOrderController.findById(request, reply),
  );

  fastify.get(
    '/:id',
    {
      preHandler,
      schema: {
        description: 'Get a purchase order by ID',
        tags: ['Purchase Orders'],
        summary: 'Get Purchase Order',
      },
    },
    async (request, reply) => purchaseOrderController.findById(request, reply),
  );

  fastify.patch(
    '/:id',
    {
      preHandler,
      schema: {
        description: 'Update a draft purchase order',
        tags: ['Purchase Orders'],
        summary: 'Update Purchase Order',
      },
    },
    async (request, reply) => purchaseOrderController.update(request, reply),
  );

  fastify.post(
    '/:id/submit',
    {
      preHandler,
      schema: {
        description: 'Submit a draft purchase order',
        tags: ['Purchase Orders'],
        summary: 'Submit Purchase Order',
      },
    },
    async (request, reply) => purchaseOrderController.submit(request, reply),
  );

  fastify.post(
    '/:id/cancel',
    {
      preHandler,
      schema: {
        description: 'Cancel a purchase order',
        tags: ['Purchase Orders'],
        summary: 'Cancel Purchase Order',
      },
    },
    async (request, reply) => purchaseOrderController.cancel(request, reply),
  );

  fastify.post(
    '/:id/receive',
    {
      preHandler,
      schema: {
        description: 'Receive goods against a purchase order',
        tags: ['Purchase Orders'],
        summary: 'Receive Goods',
      },
    },
    async (request, reply) => purchaseOrderController.receiveGoods(request, reply),
  );
};
