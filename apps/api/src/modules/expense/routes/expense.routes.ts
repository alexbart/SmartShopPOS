import { FastifyPluginAsync } from 'fastify';
import { ExpenseController } from '../controller/expense.controller.js';
import { ExpenseService } from '../service/expense.service.js';
import { ExpenseRepositoryImpl } from '../repository/expense.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const expenseRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new ExpenseRepositoryImpl(prisma);
  const service = new ExpenseService(repository);
  const controller = new ExpenseController(service);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.post(
    '/expenses',
    { preHandler },
    async (request, reply) => controller.create(request, reply),
  );

  fastify.get(
    '/expenses',
    { preHandler },
    async (request, reply) => controller.list(request, reply),
  );

  fastify.get(
    '/expenses/:id',
    { preHandler },
    async (request, reply) => controller.getOne(request, reply),
  );

  fastify.post(
    '/categories',
    { preHandler },
    async (request, reply) => controller.createCategory(request, reply),
  );

  fastify.get(
    '/categories',
    { preHandler },
    async (request, reply) => controller.listCategories(request, reply),
  );

  fastify.get(
    '/categories/:id',
    { preHandler },
    async (request, reply) => controller.getCategory(request, reply),
  );
};
