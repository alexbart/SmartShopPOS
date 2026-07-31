import { FastifyPluginAsync } from 'fastify';
import { PaymentController } from '../controllers/payment.controller.js';
import { PaymentService } from '../service/payment.service.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';
import { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { InMemoryEventBus } from '../../../shared/events/event-bus.js';

const prisma = new PrismaClient();
const unitOfWork = new UnitOfWork();
const eventBus = new InMemoryEventBus();

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  const paymentService = new PaymentService(unitOfWork, prisma, eventBus);
  const paymentController = new PaymentController(paymentService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    paymentController.create(request, reply),
  );
  fastify.get('/sale/:saleId', { preHandler: [authenticateHook] }, async (request, reply) =>
    paymentController.findBySaleId(request, reply),
  );
};
