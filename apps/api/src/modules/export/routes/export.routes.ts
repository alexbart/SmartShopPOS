import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { ExportController } from '../controller/export.controller.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exportController = new ExportController();

export const exportRoutes: FastifyPluginAsync = async (fastify) => {
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get(
    '/export',
    {
      preHandler: [authenticateHook],
      schema: {
        description: 'Export any registered report to CSV, Excel, or PDF',
        tags: ['Reports', 'Export'],
        summary: 'Export Report',
        querystring: {
          type: 'object',
          required: ['report', 'format'],
          properties: {
            report: {
              type: 'string',
              description: 'Report name (sales, inventory, customers, etc.)',
            },
            format: { type: 'string', enum: ['csv', 'xlsx', 'pdf'], description: 'Export format' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orgId = request.requestContext?.organizationId;
      if (!orgId) {
        return reply.status(401).send({
          success: false,
          message: 'Organization context required.',
        });
      }

      const query = request.query as Record<string, unknown>;
      const { report, format, ...filters } = query;

      try {
        const result = await exportController.export(
          { report: report as string, format: format as string, ...filters },
          orgId as string,
        );

        reply.header('Content-Type', result.contentType);
        reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
        reply.header('Content-Length', result.buffer.length);

        return reply.send(result.buffer);
      } catch (error) {
        const err = error as { statusCode?: number; message: string };
        const status = err.statusCode ?? 500;
        return reply.status(status).send({
          success: false,
          message: err.message,
        });
      }
    },
  );
};
