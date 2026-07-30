import type { FastifyReply, FastifyRequest } from 'fastify';

export class AuthController {
  static async register(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async refresh(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async me(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async changePassword(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async getSessions(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async deleteSession(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  static async deleteAllSessions(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }
}
