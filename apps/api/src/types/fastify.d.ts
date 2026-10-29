import type { FeatureFlag } from '../config/featureFlags.js';

declare module 'fastify' {
  interface FastifyInstance {
    featureFlags: FeatureFlag;
  }
}
