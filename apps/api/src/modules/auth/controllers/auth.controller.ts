import type { FastifyReply, FastifyRequest } from "fastify";
import type { IAuthService } from "../types/auth.types.js";
import { RegisterMapper } from "../mappers/register.mapper.js";
import type { RegisterDto } from "../dto/register.dto.js";
import type { RegisterResponse } from "../responses/register.response.js";

export class AuthController {
  constructor(private readonly _authService: IAuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as RegisterDto;
    const command = RegisterMapper.toRegisterCommand(body);
    const result = await this._authService.register(command) as RegisterResponse;

    return reply.status(201).send({
      success: true,
      message: "Organization registered successfully.",
      data: result,
    });
  }

  async login(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async refresh(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async forgotPassword(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async resetPassword(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async me(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async updateProfile(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async changePassword(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async getSessions(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async deleteSession(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }

  async deleteAllSessions(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, message: "Not implemented yet" });
  }
}
