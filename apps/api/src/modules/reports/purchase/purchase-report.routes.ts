import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { getPrisma } from '../../../shared/database/prisma.js';
import { PurchaseReportRepositoryImpl } from './repository/purchase-report.repository.impl.js';

const prisma = getPrisma();

export const purchaseReportRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = createAuthenticateHook(new JwtService(), new AuthRepositoryImpl(prisma));
  const repository = new PurchaseReportRepositoryImpl(prisma);
  const filters = (request: FastifyRequest) => {
    const query = request.query as Record<string, string | undefined>;
    return {
      organizationId: request.requestContext.organizationId,
      page: Math.max(1, Number(query.page) || 1),
      limit: Math.min(100, Math.max(1, Number(query.limit) || 50)),
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      status: query.status,
      supplierId: query.supplierId,
    };
  };
  const preHandler = [authenticate];

  fastify.get('/purchases', { preHandler }, async (request, reply) => {
    const params = filters(request);
    const [report, summary] = await Promise.all([
      repository.getPurchaseSummary(params),
      repository.getPurchaseSummaryTotals(params),
    ]);
    return reply.send({ success: true, data: { ...report, summary } });
  });
  fastify.get('/purchases/top-suppliers', { preHandler }, async (request, reply) =>
    reply.send({ success: true, data: await repository.getTopSuppliers(filters(request)) }),
  );
  fastify.get('/purchases/outstanding-orders', { preHandler }, async (request, reply) =>
    reply.send({ success: true, data: await repository.getOutstandingOrders(filters(request)) }),
  );
  fastify.get('/purchases/late-deliveries', { preHandler }, async (request, reply) =>
    reply.send({ success: true, data: await repository.getLateDeliveries(filters(request)) }),
  );
};
