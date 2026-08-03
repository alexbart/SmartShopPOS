import { FastifyPluginAsync } from 'fastify';

export const featureFlagRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: Record<string, boolean> }>(
    '/',
    {
      schema: {
        description: 'Get all feature flags',
        tags: ['Config'],
      },
    },
    async (request, reply) => {
      reply.send(fastify.featureFlags);
    },
  );
};
