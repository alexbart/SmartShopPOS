import { FastifyPluginAsync } from 'fastify';
import { CustomerController } from '../controllers/customer.controller.js';
import { CustomerService } from '../service/customer.service.js';
import { CustomerRepositoryImpl } from '../repositories/customer.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const customerRoutes: FastifyPluginAsync = async (fastify) => {
  const customerRepository = new CustomerRepositoryImpl(prisma);
  const customerService = new CustomerService(customerRepository);
  const customerController = new CustomerController(customerService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    customerController.findAll(request, reply),
  );
  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    customerController.findById(request, reply),
  );
  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    customerController.create(request, reply),
  );
  fastify.patch('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    customerController.update(request, reply),
  );
  fastify.delete('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    customerController.delete(request, reply),
  );
};
