import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { loggerPlugin, requestLoggerPlugin } from './plugins/logger.js';
import { requestIdPlugin } from './plugins/requestId.js';
import { errorHandlerPlugin } from './plugins/errorHandler.js';
import { swaggerConfig } from './config/swagger.js';
import { healthRoute } from './routes/health.js';
import { env } from './config/env.js';
import { createCacheService } from './shared/services/cache/cache.factory.js';
import { AuthRoutes } from './modules/auth/index.js';
import { CategoryRoutes } from './modules/category/index.js';
import { brandRoutes } from './modules/brand/index.js';
import { unitRoutes } from './modules/unit/index.js';
import { taxRoutes } from './modules/tax/index.js';
import { productRoutes } from './modules/product/index.js';
import { warehouseRoutes } from './modules/warehouse/index.js';
import { supplierRoutes } from './modules/supplier/index.js';
import { inventoryRoutes } from './modules/inventory/index.js';
import { customerRoutes } from './modules/customer/index.js';
import { cartRoutes } from './modules/cart/index.js';
import { saleRoutes } from './modules/sale/index.js';
import { paymentRoutes } from './modules/payment/index.js';
import { receiptRoutes } from './modules/receipt/index.js';
import { dashboardRoutes } from './modules/dashboard/index.js';
import { salesReportRoutes } from './modules/reports/index.js';
import { inventoryReportRoutes } from './modules/reports/inventory/index.js';
import { customerReportRoutes } from './modules/reports/customer/index.js';
import { exportRoutes } from './modules/export/index.js';
import { purchaseOrderRoutes } from './modules/purchase-order/index.js';
import { cashDrawerRoutes } from './modules/cash/index.js';
import { expenseRoutes } from './modules/expense/index.js';
import { financeReportRoutes } from './modules/reports/finance/index.js';
import { bankingRoutes } from './modules/banking/index.js';
import { workflowRoutes } from './modules/workflow/index.js';
import { getPrisma } from './shared/database/prisma.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
      redact: ['req.headers.authorization'],
    },
    requestIdLogName: 'requestId',
    requestIdHeader: 'x-request-id',
  });

  await app.register(cors, { origin: true });
  await app.register(swagger, swaggerConfig);
  await app.register(swaggerUi, { routePrefix: '/docs' });
  await app.register(loggerPlugin);
  await app.register(requestIdPlugin);
  await app.register(requestLoggerPlugin);
  await app.register(errorHandlerPlugin);

  const cacheService = createCacheService(env, app.log);
  app.decorate('cacheService', cacheService);

  await app.register(healthRoute, { prefix: '/api/v1' });
  await app.register(AuthRoutes, { prefix: '/api/v1/auth' });
  await app.register(CategoryRoutes, { prefix: '/api/v1/categories' });
  await app.register(brandRoutes, { prefix: '/api/v1/brands' });
  await app.register(unitRoutes, { prefix: '/api/v1/units' });
  await app.register(taxRoutes, { prefix: '/api/v1/taxes' });
  await app.register(productRoutes, { prefix: '/api/v1/products' });
  await app.register(warehouseRoutes, { prefix: '/api/v1/warehouses' });
  await app.register(supplierRoutes, { prefix: '/api/v1/suppliers' });
  await app.register(inventoryRoutes, { prefix: '/api/v1/inventory' });
  await app.register(customerRoutes, { prefix: '/api/v1/customers' });
  await app.register(cartRoutes, { prefix: '/api/v1/carts' });
  await app.register(saleRoutes, { prefix: '/api/v1/sales' });
  await app.register(paymentRoutes, { prefix: '/api/v1/payments' });
  await app.register(receiptRoutes, { prefix: '/api/v1/receipts' });
  await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  await app.register(salesReportRoutes, { prefix: '/api/v1/reports' });
  await app.register(inventoryReportRoutes, { prefix: '/api/v1/reports' });
  await app.register(customerReportRoutes, { prefix: '/api/v1/reports' });
  await app.register(exportRoutes, { prefix: '/api/v1/reports' });
  await app.register(purchaseOrderRoutes, { prefix: '/api/v1/purchase-orders' });
  await app.register(cashDrawerRoutes, { prefix: '/api/v1/cash-drawers' });
  await app.register(expenseRoutes, { prefix: '/api/v1/finance' });
  await app.register(financeReportRoutes, { prefix: '/api/v1/reports/finance' });
  await app.register(bankingRoutes, { prefix: '/api/v1/banking' });
  await app.register(workflowRoutes, { prefix: '/api/v1/workflow' });

  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    app.log.info('Connected successfully to database');
  } catch (error) {
    app.log.error({ err: error, service: 'SmartShopPOS API' }, 'Database connection failed');
    throw error;
  }

  return app;
}
