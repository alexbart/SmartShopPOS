import { FastifyPluginAsync } from 'fastify';
import { SalesReportController } from '../controller/sales-report.controller.js';
import { SalesReportService } from '../service/sales-report.service.js';
import { SalesReportRepositoryImpl } from '../repository/sales-report.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';
import { registerSalesReport } from '../sales-report.registration.js';
import { registerPurchaseReports } from '../purchase/purchase-report.registration.js';
import { PurchaseReportRepositoryImpl } from '../purchase/repository/purchase-report.repository.impl.js';
import { registerFinanceReports } from '../finance/finance-report-definitions.js';
import { FinanceReportRepositoryImpl } from '../finance/repository/finance-report.repository.impl.js';

const prisma = new PrismaClient();

registerSalesReport(new SalesReportRepositoryImpl(prisma));
registerPurchaseReports(new PurchaseReportRepositoryImpl(prisma));
registerFinanceReports(new FinanceReportRepositoryImpl(prisma));

export const salesReportRoutes: FastifyPluginAsync = async (fastify) => {
  const salesReportRepository = new SalesReportRepositoryImpl(prisma);
  const salesReportService = new SalesReportService(salesReportRepository);
  const salesReportController = new SalesReportController(salesReportService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get(
    '/sales',
    {
      preHandler: [authenticateHook],
      schema: {
        description: 'Get sales report with filters and pagination',
        tags: ['Reports'],
        summary: 'Sales Report',
        querystring: {
          from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          branchId: { type: 'string', description: 'Branch ID' },
          cashierId: { type: 'string', description: 'Cashier ID' },
          customerId: { type: 'string', description: 'Customer ID' },
          paymentMethod: { type: 'string', enum: ['CASH', 'MPESA', 'CARD', 'BANK', 'CREDIT'] },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'VOIDED', 'REFUNDED'] },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
        },
      },
    },
    async (request, reply) => salesReportController.getSalesReport(request, reply),
  );
};
