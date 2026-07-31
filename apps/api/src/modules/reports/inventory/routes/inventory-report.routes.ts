import { FastifyPluginAsync } from 'fastify';
import { InventoryReportController } from '../controller/inventory-report.controller.js';
import { InventoryReportService } from '../service/inventory-report.service.js';
import { InventoryReportRepositoryImpl } from '../repository/inventory-report.repository.impl.js';
import { createAuthenticateHook } from '../../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const inventoryReportRoutes: FastifyPluginAsync = async (fastify) => {
  const inventoryReportRepository = new InventoryReportRepositoryImpl(prisma);
  const inventoryReportService = new InventoryReportService(inventoryReportRepository);
  const inventoryReportController = new InventoryReportController(inventoryReportService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.get(
    '/inventory/stock',
    {
      preHandler,
      schema: {
        description: 'Get current stock levels with filters',
        tags: ['Reports'],
        summary: 'Current Stock Report',
        querystring: {
          warehouseId: { type: 'string' },
          categoryId: { type: 'string' },
          brandId: { type: 'string' },
          supplierId: { type: 'string' },
          search: { type: 'string' },
          activeOnly: { type: 'string' },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
        },
      },
    },
    async (request, reply) => inventoryReportController.getCurrentStock(request, reply),
  );

  fastify.get(
    '/inventory/movements',
    {
      preHandler,
      schema: {
        description: 'Get stock movement history (audit trail)',
        tags: ['Reports'],
        summary: 'Stock Movements Report',
        querystring: {
          from: { type: 'string' },
          to: { type: 'string' },
          warehouseId: { type: 'string' },
          productId: { type: 'string' },
          movementType: { type: 'string' },
          performedBy: { type: 'string' },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
        },
      },
    },
    async (request, reply) => inventoryReportController.getStockMovements(request, reply),
  );

  fastify.get(
    '/inventory/low-stock',
    {
      preHandler,
      schema: {
        description: 'Get products with low stock (quantity > 0 and <= lowStockThreshold)',
        tags: ['Reports'],
        summary: 'Low Stock Report',
        querystring: {
          warehouseId: { type: 'string' },
          categoryId: { type: 'string' },
          brandId: { type: 'string' },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
        },
      },
    },
    async (request, reply) => inventoryReportController.getLowStock(request, reply),
  );

  fastify.get(
    '/inventory/out-of-stock',
    {
      preHandler,
      schema: {
        description: 'Get products that are out of stock (quantity = 0)',
        tags: ['Reports'],
        summary: 'Out of Stock Report',
        querystring: {
          warehouseId: { type: 'string' },
          categoryId: { type: 'string' },
          brandId: { type: 'string' },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '50' },
        },
      },
    },
    async (request, reply) => inventoryReportController.getOutOfStock(request, reply),
  );
};
