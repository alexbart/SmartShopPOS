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
    { preHandler, schema: { description: 'Create an approval request', tags: ['Workflow'], summary: 'Request Approval' } },
    async (request, reply) => controller.requestApproval(request, reply),
  );

  fastify.get(
    '/pending',
    { preHandler, schema: { description: 'List pending approvals for current user role', tags: ['Workflow'], summary: 'Pending Approvals' } },
    async (request, reply) => controller.pending(request, reply),
  );

  fastify.get(
    '/history',
    { preHandler, schema: { description: 'Get approval request history for an entity', tags: ['Workflow'], summary: 'Request History' } },
    async (request, reply) => controller.history(request, reply),
  );

  fastify.post(
    '/:id/approve',
    { preHandler, schema: { description: 'Approve an approval request', tags: ['Workflow'], summary: 'Approve Request' } },
    async (request, reply) => controller.approve(request, reply),
  );

  fastify.post(
    '/:id/reject',
    { preHandler, schema: { description: 'Reject an approval request', tags: ['Workflow'], summary: 'Reject Request' } },
    async (request, reply) => controller.reject(request, reply),
  );
};
