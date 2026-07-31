import { FastifyPluginAsync } from 'fastify';
import { WorkflowController } from '../controller/workflow.controller.js';
import { WorkflowService } from '../service/workflow.service.js';
import { WorkflowRepositoryImpl } from '../repository/workflow.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const workflowRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new WorkflowRepositoryImpl(prisma);
  const service = new WorkflowService(repository);
  const controller = new WorkflowController(service);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.post(
    '/request',
    { preHandler },
    async (request, reply) => controller.requestApproval(request, reply),
  );

  fastify.get(
    '/pending',
    { preHandler },
    async (request, reply) => controller.pending(request, reply),
  );

  fastify.get(
    '/history',
    { preHandler },
    async (request, reply) => controller.history(request, reply),
  );

  fastify.post(
    '/:id/approve',
    { preHandler },
    async (request, reply) => controller.approve(request, reply),
  );

  fastify.post(
    '/:id/reject',
    { preHandler },
    async (request, reply) => controller.reject(request, reply),
  );
};
