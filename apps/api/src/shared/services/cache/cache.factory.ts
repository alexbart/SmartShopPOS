import type { FastifyBaseLogger } from 'fastify';
import { NoOpCacheService, RedisCacheService, type CacheService } from './cache.service.js';
import type { env } from '../../../config/env.js';

export function createCacheService(
  environment: typeof env,
  logger: FastifyBaseLogger,
): CacheService {
  if (environment.REDIS_ENABLED && environment.REDIS_URL) {
    return new RedisCacheService(environment.REDIS_URL, logger);
  }

  logger.warn('Redis is disabled. Using NoOp cache service.');
  return new NoOpCacheService();
}
