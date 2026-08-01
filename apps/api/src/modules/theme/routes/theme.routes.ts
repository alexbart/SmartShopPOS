import { FastifyPluginAsync } from 'fastify';
import { ThemeController } from '../controller/theme.controller.js';
import { ThemeService } from '../service/theme.service.js';
import { ThemeRepositoryImpl } from '../repository/theme.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const themeRoutes: FastifyPluginAsync = async (fastify) => {
  const themeRepository = new ThemeRepositoryImpl(prisma);
  const themeService = new ThemeService(themeRepository);
  const themeController = new ThemeController(themeService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.get(
    '/',
    {
      preHandler,
      schema: {
        description: 'Get organization theme',
        tags: ['Organization'],
        summary: 'Get Theme',
      },
    },
    async (request, reply) => themeController.get(request, reply),
  );

  fastify.patch(
    '/',
    {
      preHandler,
      schema: {
        description: 'Update organization theme',
        tags: ['Organization'],
        summary: 'Update Theme',
      },
    },
    async (request, reply) => themeController.update(request, reply),
  );
};
