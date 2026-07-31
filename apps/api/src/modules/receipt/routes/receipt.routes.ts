import { FastifyPluginAsync } from 'fastify';
import { ReceiptController } from '../controllers/receipt.controller.js';
import { ReceiptService } from '../service/receipt.service.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';
import { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { NumberSequenceService } from '../../../shared/services/number-sequence/number-sequence.service.js';

const prisma = new PrismaClient();
const unitOfWork = new UnitOfWork();
const numberSequenceService = new NumberSequenceService(prisma);

export const receiptRoutes: FastifyPluginAsync = async (fastify) => {
  const receiptService = new ReceiptService(unitOfWork, numberSequenceService, prisma);
  const receiptController = new ReceiptController(receiptService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    receiptController.create(request, reply),
  );
  fastify.get('/number/:number', { preHandler: [authenticateHook] }, async (request, reply) =>
    receiptController.findByNumber(request, reply),
  );
  fastify.get('/sale/:saleId', { preHandler: [authenticateHook] }, async (request, reply) =>
    receiptController.findBySaleId(request, reply),
  );
};
