import { FastifyPluginAsync } from 'fastify';
import { SaleController } from '../controllers/sale.controller.js';
import { SaleService } from '../service/sale.service.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';
import { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { NumberSequenceService } from '../../../shared/services/number-sequence/number-sequence.service.js';
import { StockService } from '../../inventory/services/stock.service.js';

const prisma = new PrismaClient();
const unitOfWork = new UnitOfWork();
const numberSequenceService = new NumberSequenceService(prisma);
const stockService = new StockService(unitOfWork, prisma);

export const saleRoutes: FastifyPluginAsync = async (fastify) => {
  const saleService = new SaleService(unitOfWork, numberSequenceService, stockService, prisma);
  const saleController = new SaleController(saleService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    saleController.create(request, reply),
  );
  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    saleController.findById(request, reply),
  );
  fastify.patch('/:id/void', { preHandler: [authenticateHook] }, async (request, reply) =>
    saleController.void(request, reply),
  );
};
