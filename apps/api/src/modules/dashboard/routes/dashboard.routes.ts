import { FastifyPluginAsync } from 'fastify';
import { DashboardController } from '../controller/dashboard.controller.js';
import { DashboardService } from '../service/dashboard.service.js';
import { DashboardRepositoryImpl } from '../repository/dashboard.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  const dashboardRepository = new DashboardRepositoryImpl(prisma);
  const dashboardService = new DashboardService(dashboardRepository);
  const dashboardController = new DashboardController(dashboardService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get(
    '/',
    {
      preHandler: [authenticateHook],
      schema: {
        description: 'Get dashboard overview for the authenticated organization',
        tags: ['Dashboard'],
        summary: 'Dashboard',
      },
    },
    async (request, reply) => dashboardController.getDashboard(request, reply),
  );
};
