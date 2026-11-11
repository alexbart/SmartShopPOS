import { FastifyPluginAsync } from 'fastify';
import { ReceiptTemplateController } from '../controller/receipt-template.controller.js';
import { ReceiptTemplateService } from '../service/receipt-template.service.js';
import { ReceiptTemplateRepositoryImpl } from '../repository/receipt-template.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { getPrisma } from '../../../shared/database/prisma.js';

const prisma = getPrisma();

export const receiptTemplateRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new ReceiptTemplateRepositoryImpl(prisma);
  const service = new ReceiptTemplateService(repository);
  const controller = new ReceiptTemplateController(service);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    controller.findAll(request, reply),
  );

  fastify.get('/default', { preHandler: [authenticateHook] }, async (request, reply) =>
    controller.findDefault(request, reply),
  );

  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    controller.findById(request, reply),
  );

  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    controller.create(request, reply),
  );

  fastify.patch('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    controller.update(request, reply),
  );

  fastify.patch('/:id/default', { preHandler: [authenticateHook] }, async (request, reply) =>
    controller.setDefault(request, reply),
  );

  fastify.delete('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    controller.delete(request, reply),
  );
};
