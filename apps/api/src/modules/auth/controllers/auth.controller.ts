import type { FastifyReply, FastifyRequest } from 'fastify';
import type { IAuthService } from '../types/auth.types.js';
import { RegisterMapper } from '../mappers/register.mapper.js';
import { toLoginCommand } from '../mappers/login.mapper.js';
import type { RegisterDto } from '../dto/register.dto.js';
import type { RegisterResponse } from '../responses/register.response.js';
import type { LoginDto } from '../dto/login.dto.js';
import type { FindUsersQuery } from '../repositories/models/find-users.query.js';

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

  async findUsers(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as FindUsersQuery;
    query.organizationId = request.requestContext.organizationId;

    const result = await this._authService.findUsers(query);

    return reply.status(200).send({
      success: true,
      message: 'Users retrieved successfully.',
      data: result,
    });
  }

  async createUser(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
      roleId?: string;
      branchId?: string;
      isActive?: boolean;
    };

    const result = await this._authService.createUser({
      organizationId: request.requestContext.organizationId,
      branchId: body.branchId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      password: body.password,
      roleId: body.roleId,
      isActive: body.isActive,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'User created successfully.',
      data: result,
    });
  }

  async updateUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      isActive: boolean;
      roleId: string;
    }>;

    await this._authService.updateUser({
      userId: id,
      organizationId: request.requestContext.organizationId,
      updatedBy: request.requestContext.userId,
      ...body,
    });

    return reply.status(200).send({
      success: true,
      message: 'User updated successfully.',
    });
  }

  async deactivateUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._authService.deactivateUser(
      id,
      request.requestContext.organizationId,
      request.requestContext.userId,
    );

    return reply.status(200).send({
      success: true,
      message: 'User deactivated successfully.',
    });
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as { password: string };

    await this._authService.resetPassword({
      userId: id,
      organizationId: request.requestContext.organizationId,
      newPassword: body.password,
      updatedBy: request.requestContext.userId,
    });

    return reply.status(200).send({
      success: true,
      message: 'Password reset successfully.',
    });
  }
}
