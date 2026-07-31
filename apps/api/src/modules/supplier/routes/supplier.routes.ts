import { FastifyPluginAsync } from 'fastify';
import { SupplierController } from '../controllers/supplier.controller.js';
import { SupplierService } from '../service/supplier.service.js';
import { SupplierRepositoryImpl } from '../repositories/supplier.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const supplierRoutes: FastifyPluginAsync = async (fastify) => {
  const supplierRepository = new SupplierRepositoryImpl(prisma);
  const supplierService = new SupplierService(supplierRepository);
  const supplierController = new SupplierController(supplierService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    supplierController.findAll(request, reply),
  );
  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    supplierController.findById(request, reply),
  );
  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    supplierController.create(request, reply),
  );
  fastify.patch('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    supplierController.update(request, reply),
  );
  fastify.delete('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    supplierController.delete(request, reply),
  );
};
