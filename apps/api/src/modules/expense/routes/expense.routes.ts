import { FastifyPluginAsync } from 'fastify';
import { ExpenseController } from '../controller/expense.controller.js';
import { ExpenseService } from '../service/expense.service.js';
import { ExpenseRepositoryImpl } from '../repository/expense.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { WorkflowService } from '../../workflow/service/workflow.service.js';
import { WorkflowRepositoryImpl } from '../../workflow/repository/workflow.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const expenseRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new ExpenseRepositoryImpl(prisma);
  const workflowService = new WorkflowService(new WorkflowRepositoryImpl(prisma));
  const service = new ExpenseService(repository, workflowService);
  const controller = new ExpenseController(service);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.post(
    '/expenses',
    { preHandler, schema: { description: 'Create a new expense', tags: ['Finance'], summary: 'Create Expense' } },
    async (request, reply) => controller.create(request, reply),
  );

  fastify.get(
    '/expenses',
    { preHandler, schema: { description: 'List expenses', tags: ['Finance'], summary: 'List Expenses' } },
    async (request, reply) => controller.list(request, reply),
  );

  fastify.get(
    '/expenses/:id',
    { preHandler, schema: { description: 'Get a single expense', tags: ['Finance'], summary: 'Get Expense' } },
    async (request, reply) => controller.getOne(request, reply),
  );

  fastify.post(
    '/categories',
    { preHandler, schema: { description: 'Create expense category', tags: ['Finance'], summary: 'Create Category' } },
    async (request, reply) => controller.createCategory(request, reply),
  );

  fastify.get(
    '/categories',
    { preHandler, schema: { description: 'List expense categories', tags: ['Finance'], summary: 'List Categories' } },
    async (request, reply) => controller.listCategories(request, reply),
  );

  fastify.get(
    '/categories/:id',
    { preHandler, schema: { description: 'Get an expense category', tags: ['Finance'], summary: 'Get Category' } },
    async (request, reply) => controller.getCategory(request, reply),
  );
};
