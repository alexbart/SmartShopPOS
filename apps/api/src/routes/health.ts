import type { FastifyPluginAsync } from 'fastify';
import { loadavg } from 'node:os';
import { performance } from 'node:perf_hooks';
import { getPrisma } from '../shared/database/prisma.js';
import { env } from '../config/env.js';
import type { CacheService } from '../shared/services/cache/cache.service.js';
import {
  createAuthenticateHook,
  createAuthorizeHook,
} from '../modules/auth/middleware/auth.middleware.js';
import { AuthRepositoryImpl } from '../modules/auth/repositories/auth.repository.impl.js';
import { JwtService } from '../shared/services/jwt/jwt.service.js';

type CheckStatus = 'healthy' | 'degraded' | 'down' | 'disabled';

interface ServiceCheck {
  name: string;
  status: CheckStatus;
  checkedAt: string;
  latencyMs?: number;
  details?: string;
}

async function checkDependency(
  name: string,
  probe: () => Promise<unknown>,
  timeoutMs = 2_500,
): Promise<ServiceCheck> {
  const startedAt = performance.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      probe(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error('Health check timed out')), timeoutMs);
      }),
    ]);
    return {
      name,
      status: 'healthy',
      checkedAt: new Date().toISOString(),
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    return {
      name,
      status: 'down',
      checkedAt: new Date().toISOString(),
      latencyMs: Math.round(performance.now() - startedAt),
      details:
        error instanceof Error && error.message === 'Health check timed out'
          ? 'Health check timed out'
          : 'Connection check failed',
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrisma();
  const cacheService = (fastify as unknown as Record<string, unknown>).cacheService as
    CacheService | undefined;
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticate = createAuthenticateHook(new JwtService(), authRepository);
  const authorizeRead = createAuthorizeHook(['health:read']);

  // Minimal liveness endpoint for local and platform process checks.
  fastify.get('/health', async () => ({
    success: true,
    data: {
      status: 'healthy',
      service: 'SmartShopPOS API',
      checkedAt: new Date().toISOString(),
    },
  }));

  // Dependency and runtime diagnostics are restricted to users with health:read.
  fastify.get('/health/details', { preHandler: [authenticate, authorizeRead] }, async () => {
    const database = await checkDependency('PostgreSQL', () => prisma.$queryRaw`SELECT 1`);
    let redis: ServiceCheck;

    if (!env.REDIS_ENABLED) {
      redis = {
        name: 'Redis',
        status: 'disabled',
        checkedAt: new Date().toISOString(),
        details: 'Redis is not enabled',
      };
    } else if (!env.REDIS_URL) {
      redis = {
        name: 'Redis',
        status: 'down',
        checkedAt: new Date().toISOString(),
        details: 'Redis is enabled but no connection URL is configured',
      };
    } else if (cacheService) {
      redis = await checkDependency('Redis', () => cacheService.get('health-center-probe'));
    } else {
      redis = {
        name: 'Redis',
        status: 'down',
        checkedAt: new Date().toISOString(),
        details: 'Cache service is unavailable',
      };
    }

    const status =
      database.status === 'down' ? 'down' : redis.status === 'down' ? 'degraded' : 'healthy';
    const memory = process.memoryUsage();

    return {
      success: true,
      data: {
        status,
        checkedAt: new Date().toISOString(),
        services: [
          {
            name: 'API',
            status: 'healthy' as const,
            checkedAt: new Date().toISOString(),
            details: 'Diagnostics endpoint responded',
          },
          database,
          redis,
        ],
        system: {
          uptimeSeconds: Math.floor(process.uptime()),
          memory: {
            rssBytes: memory.rss,
            heapUsedBytes: memory.heapUsed,
            heapTotalBytes: memory.heapTotal,
          },
          cpu: {
            loadAverage: process.platform === 'win32' ? null : loadavg(),
            supported: process.platform !== 'win32',
          },
        },
        build: {
          version: '1.0.0',
          buildTime: process.env.BUILD_TIME,
        },
      },
    };
  });
};
