import { FastifyPluginAsync } from 'fastify';
import { CustomerReportController } from '../controller/customer-report.controller.js';
import { CustomerReportService } from '../service/customer-report.service.js';
import { CustomerReportRepositoryImpl } from '../repository/customer-report.repository.impl.js';
import { createAuthenticateHook } from '../../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const customerReportRoutes: FastifyPluginAsync = async (fastify) => {
  const customerReportRepository = new CustomerReportRepositoryImpl(prisma);
  const customerReportService = new CustomerReportService(customerReportRepository);
  const customerReportController = new CustomerReportController(customerReportService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.get(
    '/customers',
    {
      preHandler,
      schema: {
        description: 'Get customer summary report',
        tags: ['Reports'],
        summary: 'Customer Summary',
        querystring: {
          search: { type: 'string' },
          isActive: { type: 'string' },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
        },
      },
    },
    async (request, reply) => customerReportController.getCustomerSummary(request, reply),
  );

  fastify.get(
    '/customers/:customerId/purchases',
    {
      preHandler,
      schema: {
        description: 'Get customer purchase history',
        tags: ['Reports'],
        summary: 'Customer Purchases',
        params: {
          type: 'object',
          properties: {
            customerId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          from: { type: 'string' },
          to: { type: 'string' },
          branchId: { type: 'string', format: 'uuid' },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
        },
      },
    },
    async (request, reply) => customerReportController.getCustomerPurchases(request, reply),
  );

  fastify.get(
    '/customers/top',
    {
      preHandler,
      schema: {
        description: 'Get top customers by total spending',
        tags: ['Reports'],
        summary: 'Top Customers',
        querystring: {
          limit: { type: 'string', default: '20' },
        },
      },
    },
    async (request, reply) => customerReportController.getTopCustomers(request, reply),
  );
};
