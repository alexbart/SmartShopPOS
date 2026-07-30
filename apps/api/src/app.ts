import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { loggerPlugin } from './plugins/logger.js';
import { errorHandlerPlugin } from './plugins/errorHandler.js';
import { swaggerConfig } from './config/swagger.js';
import { healthRoute } from './routes/health.js';
import { AuthRoutes } from './modules/auth/index.js';
import { getPrisma } from './shared/database/prisma.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  await app.register(cors, { origin: true });
  await app.register(swagger, swaggerConfig);
  await app.register(swaggerUi, { routePrefix: '/docs' });
  await app.register(loggerPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(healthRoute, { prefix: '/api/v1' });
  await app.register(AuthRoutes, { prefix: '/api/v1/auth' });

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
