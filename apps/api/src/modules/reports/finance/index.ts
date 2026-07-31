import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { FinanceReportRepositoryImpl } from './repository/finance-report.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';

const prisma = new PrismaClient();

export const financeReportRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new FinanceReportRepositoryImpl(prisma);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.get(
    '/daily-cash-summary',
    { preHandler },
    async (request, reply) => {
      const query = request.query as Record<string, string | undefined>;
      const data = await repository.dailyCashSummary({
        organizationId: request.requestContext.organizationId,
        date: query.date ? new Date(query.date) : undefined,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      });
      return reply.status(200).send({ success: true, message: 'Daily cash summary retrieved.', data });
    },
  );

  fastify.get(
    '/expense-report',
    { preHandler },
    async (request, reply) => {
      const query = request.query as Record<string, string | undefined>;
      const data = await repository.expenseReport({
        organizationId: request.requestContext.organizationId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      });
      return reply.status(200).send({ success: true, message: 'Expense report retrieved.', data });
    },
  );

  fastify.get(
    '/profit-summary',
    { preHandler },
    async (request, reply) => {
      const query = request.query as Record<string, string | undefined>;
      const data = await repository.profitSummary({
        organizationId: request.requestContext.organizationId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      });
      return reply.status(200).send({ success: true, message: 'Profit summary retrieved.', data });
    },
  );

  fastify.get(
    '/cash-drawer-variance',
    { preHandler },
    async (request, reply) => {
      const query = request.query as Record<string, string | undefined>;
      const data = await repository.cashDrawerVariance({
        organizationId: request.requestContext.organizationId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      });
      return reply.status(200).send({ success: true, message: 'Variance report retrieved.', data });
    },
  );

  fastify.get(
    '/sales-by-payment-method',
    { preHandler },
    async (request, reply) => {
      const query = request.query as Record<string, string | undefined>;
      const data = await repository.salesByPaymentMethod({
        organizationId: request.requestContext.organizationId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      });
      return reply.status(200).send({ success: true, message: 'Payment method report retrieved.', data });
    },
  );
};
