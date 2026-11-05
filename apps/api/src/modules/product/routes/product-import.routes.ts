import { FastifyPluginAsync } from 'fastify';
import { ProductImportController } from '../controllers/product-import.controller.js';
import { ProductImportService } from '../service/product-import.service.js';
import { getPrisma } from '../../../shared/database/prisma.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';

const prisma = getPrisma();

export const productImportRoutes: FastifyPluginAsync = async (fastify) => {
  const productImportService = new ProductImportService(prisma);
  const productImportController = new ProductImportController(productImportService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/import/template', { preHandler: [authenticateHook] }, async (request, reply) =>
    productImportController.downloadTemplate(request, reply),
  );

  fastify.post(
    '/import/upload',
    {
      preHandler: [authenticateHook],
      // Base64 body of the workbook: 15 MB file + encoding overhead.
      bodyLimit: 24 * 1024 * 1024,
    },
    async (request, reply) => productImportController.uploadWorkbook(request, reply),
  );

  fastify.post('/import', { preHandler: [authenticateHook] }, async (request, reply) =>
    productImportController.createImportJob(request, reply),
  );

  fastify.post('/import/rows', { preHandler: [authenticateHook] }, async (request, reply) =>
    productImportController.createImportJobWithRows(request, reply),
  );

  fastify.get('/import/:jobId', { preHandler: [authenticateHook] }, async (request, reply) =>
    productImportController.getImportJobStatus(request, reply),
  );

  fastify.post(
    '/import/:jobId/process',
    { preHandler: [authenticateHook] },
    async (request, reply) => productImportController.processImportJob(request, reply),
  );
};
