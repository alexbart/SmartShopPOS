import type { FastifyReply, FastifyRequest } from 'fastify';
import type { IAuthService } from '../types/auth.types.js';
import { RegisterMapper } from '../mappers/register.mapper.js';
import { toLoginCommand } from '../mappers/login.mapper.js';
import type { RegisterDto } from '../dto/register.dto.js';
import type { RegisterResponse } from '../responses/register.response.js';
import type { LoginDto } from '../dto/login.dto.js';

export class AuthController {
  constructor(private readonly _authService: IAuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as RegisterDto;
    const command = RegisterMapper.toRegisterCommand(body);
    const result = (await this._authService.register(command)) as RegisterResponse;

    return reply.status(201).send({
      success: true,
      message: 'Organization registered successfully.',
      data: result,
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LoginDto;
    const command = toLoginCommand(body);
    const result = await this._authService.login(command);

    return reply.status(200).send({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { refreshToken: string };
    const result = await this._authService.refresh(body.refreshToken);

    return reply.status(200).send({
      success: true,
      message: 'Tokens refreshed successfully.',
      data: result,
    });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const result = await this._authService.me(request.requestContext.userId);

    return reply.status(200).send({
      success: true,
      message: 'Current user retrieved successfully.',
      data: result,
    });
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { refreshToken: string };
    await this._authService.logout(body.refreshToken);

    return reply.status(204).send();
  }

  async forgotPassword(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  async resetPassword(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  async updateProfile(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  async changePassword(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  async getSessions(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  async deleteSession(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }

  async deleteAllSessions(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: 'Not implemented yet' });
  }
}
