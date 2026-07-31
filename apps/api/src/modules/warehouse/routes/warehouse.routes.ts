import { FastifyPluginAsync } from 'fastify';
import { WarehouseController } from '../controllers/warehouse.controller.js';
import { WarehouseService } from '../service/warehouse.service.js';
import { WarehouseRepositoryImpl } from '../repositories/warehouse.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const warehouseRoutes: FastifyPluginAsync = async (fastify) => {
  const warehouseRepository = new WarehouseRepositoryImpl(prisma);
  const warehouseService = new WarehouseService(warehouseRepository);
  const warehouseController = new WarehouseController(warehouseService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    warehouseController.findAll(request, reply),
  );
  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    warehouseController.findById(request, reply),
  );
  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    warehouseController.create(request, reply),
  );
  fastify.patch('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    warehouseController.update(request, reply),
  );
  fastify.delete('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    warehouseController.delete(request, reply),
  );
};
