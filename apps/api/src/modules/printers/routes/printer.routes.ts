import { FastifyPluginAsync } from 'fastify';
import { PrinterController } from '../controller/printer.controller.js';
import { PrinterService } from '../service/printer.service.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { getPrisma } from '../../../shared/database/prisma.js';

const prisma = getPrisma();

export const printerRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new PrinterService();
  const controller = new PrinterController(service);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  /**
   * Cashiers print receipts, so this only requires a session — not a
   * permission — matching the receipt branding endpoint.
   */
  fastify.post(
    '/raw',
    {
      preHandler: [authenticateHook],
      schema: {
        description: 'Relay raw ESC/POS bytes to a printer on the local network',
        tags: ['Printers'],
        summary: 'Print raw bytes',
      },
    },
    async (request, reply) => controller.raw(request, reply),
  );
};
