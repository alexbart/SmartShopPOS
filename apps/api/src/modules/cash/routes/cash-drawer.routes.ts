import { FastifyPluginAsync } from 'fastify';
import { CashDrawerController } from '../controller/cash-drawer.controller.js';
import { CashDrawerService } from '../service/cash-drawer.service.js';
import { CashDrawerRepositoryImpl } from '../repository/cash-drawer.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const cashDrawerRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new CashDrawerRepositoryImpl(prisma);
  const service = new CashDrawerService(repository);
  const controller = new CashDrawerController(service);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.post(
    '/open',
    { preHandler, schema: { description: 'Open a cash drawer session', tags: ['Cash Drawer'], summary: 'Open Drawer' } },
    async (request, reply) => controller.open(request, reply),
  );

  fastify.post(
    '/:id/close',
    { preHandler, schema: { description: 'Close a cash drawer session', tags: ['Cash Drawer'], summary: 'Close Drawer' } },
    async (request, reply) => controller.close(request, reply),
  );

  fastify.post(
    '/:id/cash-in',
    { preHandler, schema: { description: 'Add cash to drawer', tags: ['Cash Drawer'], summary: 'Cash In' } },
    async (request, reply) => controller.cashIn(request, reply),
  );

  fastify.post(
    '/:id/cash-out',
    { preHandler, schema: { description: 'Remove cash from drawer', tags: ['Cash Drawer'], summary: 'Cash Out' } },
    async (request, reply) => controller.cashOut(request, reply),
  );

  fastify.get(
    '/current',
    { preHandler, schema: { description: 'Get current cash drawer session', tags: ['Cash Drawer'], summary: 'Current Session' } },
    async (request, reply) => controller.current(request, reply),
  );

  fastify.get(
    '/:id/movements',
    { preHandler, schema: { description: 'Get cash movements', tags: ['Cash Drawer'], summary: 'Movements' } },
    async (request, reply) => controller.movements(request, reply),
  );
};
