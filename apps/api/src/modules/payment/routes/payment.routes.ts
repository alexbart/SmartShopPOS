import { FastifyPluginAsync } from 'fastify';
import { PaymentController } from '../controllers/payment.controller.js';
import { DarajaCallbackController } from '../controllers/daraja-callback.controller.js';
import { MpesaEvidenceController } from '../controllers/mpesa-evidence.controller.js';
import { PaymentService } from '../service/payment.service.js';
import { MpesaEvidenceService } from '../service/mpesa-evidence.service.js';
import {
  createAuthenticateHook,
  createAuthorizeHook,
} from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { getPrisma } from '../../../shared/database/prisma.js';
import { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { InMemoryEventBus } from '../../../shared/events/event-bus.js';

const prisma = getPrisma();
const unitOfWork = new UnitOfWork();
const eventBus = new InMemoryEventBus();

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  const paymentService = new PaymentService(unitOfWork, prisma, eventBus);
  const paymentController = new PaymentController(paymentService);
  const evidenceService = new MpesaEvidenceService(prisma);
  const evidenceController = new MpesaEvidenceController(evidenceService);
  const callbackController = new DarajaCallbackController(paymentService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);
  const authorizeCapture = createAuthorizeHook(['payment.evidence.capture']);
  const authorizeReview = createAuthorizeHook(['payment.evidence.review']);

  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    paymentController.create(request, reply),
  );

  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    paymentController.findById(request, reply),
  );

  fastify.get('/sale/:saleId', { preHandler: [authenticateHook] }, async (request, reply) =>
    paymentController.findBySaleId(request, reply),
  );

  // M-Pesa evidence endpoints
  fastify.post(
    '/:id/evidence',
    { preHandler: [authenticateHook, authorizeCapture] },
    async (request, reply) => evidenceController.capture(request, reply),
  );

  fastify.get(
    '/:id/evidence',
    { preHandler: [authenticateHook, authorizeCapture] },
    async (request, reply) => evidenceController.listForPayment(request, reply),
  );

  fastify.patch(
    '/evidence/:evidenceId/review',
    { preHandler: [authenticateHook, authorizeReview] },
    async (request, reply) => evidenceController.review(request, reply),
  );

  fastify.patch(
    '/evidence/:evidenceId/reject',
    { preHandler: [authenticateHook, authorizeReview] },
    async (request, reply) => evidenceController.reject(request, reply),
  );

  // Daraja callback — no JWT auth, Safaricom calls this directly
  fastify.post('/mpesa/callback', async (request, reply) =>
    callbackController.handleStkCallback(request, reply),
  );
};
