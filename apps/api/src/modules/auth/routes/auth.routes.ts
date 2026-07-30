import { FastifyPluginAsync } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.post('/login', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.post('/refresh', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.post('/logout', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.post('/forgot-password', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.post('/reset-password', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.get('/me', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.patch('/profile', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.patch('/password', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.get('/sessions', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.delete('/sessions/:id', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });

  fastify.delete('/sessions', async (request, reply) => {
    return reply.send({ success: true, message: 'Not implemented yet' });
  });
};
