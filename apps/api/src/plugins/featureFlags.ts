import fp from 'fastify-plugin';
import { getFeatureFlags } from '../config/featureFlags.js';

export const featureFlagsPlugin = fp(
  async (fastify) => {
    const flags = getFeatureFlags();
    fastify.decorate('featureFlags', flags);
    fastify.log.info({ featureFlags: flags }, 'Feature flags loaded');
  },
  { name: 'feature-flags-plugin' },
);
