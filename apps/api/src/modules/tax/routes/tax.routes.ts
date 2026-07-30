import { FastifyPluginAsync } from 'fastify';
import { TaxController } from '../controllers/tax.controller.js';
import { TaxService } from '../service/tax.service.js';
import { TaxRepositoryImpl } from '../repositories/tax.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';

const prisma = new PrismaClient();

export const taxRoutes: FastifyPluginAsync = async (fastify) => {
  const taxRepository = new TaxRepositoryImpl(prisma);
  const taxService = new TaxService(taxRepository);
  const taxController = new TaxController(taxService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    taxController.findAll(request, reply),
  );
  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    taxController.findById(request, reply),
  );
  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    taxController.create(request, reply),
  );
  fastify.patch('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    taxController.update(request, reply),
  );
  fastify.delete('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    taxController.delete(request, reply),
  );
};
