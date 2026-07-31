import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';

export const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request, reply) => {
    request.requestContext = {
      ...request.requestContext,
      requestId: (request.headers['x-request-id'] as string) ?? randomUUID(),
    };
    reply.header('X-Request-ID', request.requestContext.requestId);
  });
};
