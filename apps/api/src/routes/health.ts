import { FastifyPluginAsync } from 'fastify';
import { loadavg } from 'node:os';
import { getPrisma } from '../shared/database/prisma.js';
import { env } from '../config/env.js';
import type { CacheService } from '../shared/services/cache/cache.service.js';

interface HealthStatus {
  status: 'healthy' | 'degraded';
  core: {
    database: 'up' | 'down';
  };
  optional: {
    redis: 'up' | 'down' | 'disabled';
  };
  build: {
    version: string;
    environment: string;
    buildTime?: string;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: {
    loadAvg: number[];
  };
}

export const healthRoute: FastifyPluginAsync = async (fastify, _options) => {
  let redisStatus: 'up' | 'down' | 'disabled' = 'disabled';

  const cacheService = fastify.decorators?.cacheService as CacheService | undefined;
  if (cacheService && env.REDIS_ENABLED) {
    try {
      await cacheService.get('health-check');
      redisStatus = 'up';
    } catch {
      redisStatus = 'down';
    }
  }

  fastify.get('/health', async () => {
    const health: HealthStatus = {
      status: 'healthy',
      core: {
        database: 'up',
      },
      optional: {
        redis: redisStatus,
      },
      build: {
        version: '1.0.0',
        environment: env.NODE_ENV,
        buildTime: process.env.BUILD_TIME,
      },
      uptime: Math.floor(process.uptime()),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
      },
      cpu: {
        loadAvg: loadavg(),
      },
    };

    try {
      const prisma = getPrisma();
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      health.status = 'degraded';
      health.core.database = 'down';
    }

    if (redisStatus === 'down') {
      health.status = 'degraded';
    }

    return {
      success: true,
      ...health,
    };
  });
};
