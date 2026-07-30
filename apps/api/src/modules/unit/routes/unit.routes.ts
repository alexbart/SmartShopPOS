import { FastifyPluginAsync } from 'fastify';
import { UnitController } from '../controllers/unit.controller.js';
import { UnitService } from '../service/unit.service.js';
import { UnitRepositoryImpl } from '../repositories/unit.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';

const prisma = new PrismaClient();

export const unitRoutes: FastifyPluginAsync = async (fastify) => {
  const unitRepository = new UnitRepositoryImpl(prisma);
  const unitService = new UnitService(unitRepository);
  const unitController = new UnitController(unitService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    unitController.findAll(request, reply),
  );
  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    unitController.findById(request, reply),
  );
  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    unitController.create(request, reply),
  );
  fastify.patch('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    unitController.update(request, reply),
  );
  fastify.delete('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    unitController.delete(request, reply),
  );
};
