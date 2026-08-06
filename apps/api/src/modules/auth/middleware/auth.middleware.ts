import type { FastifyRequest } from 'fastify';
import type { IJwtService } from '../../../shared/services/jwt/jwt.interface.js';
import type { IAuthRepository } from '../repositories/auth.repository.js';
import type { RequestContext } from '../../../shared/types/request-context.types.js';
import { PermissionDeniedError } from '../../../shared/errors/business-error.js';

declare module 'fastify' {
  interface FastifyRequest {
    requestContext: RequestContext;
  }
}

export const createAuthenticateHook = (jwtService: IJwtService, repository: IAuthRepository) => {
  return async (request: FastifyRequest) => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      const error = new Error('Missing or invalid authorization header') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'UNAUTHORIZED';
      error.statusCode = 401;
      throw error;
    }

    const token = authorization.slice(7);

    let payload: { userId: string; organizationId: string; roles: string[] };
    try {
      payload = await jwtService.verifyAccessToken(token);
    } catch {
      const error = new Error('Invalid or expired token') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'UNAUTHORIZED';
      error.statusCode = 401;
      throw error;
    }

    const user = await repository.findUserById(payload.userId);
    if (!user) {
      const error = new Error('User not found') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'UNAUTHORIZED';
      error.statusCode = 401;
      throw error;
    }

    const userWithRoles = await repository.findUserWithRolesById(payload.userId);
    const roles = userWithRoles?.roles ?? [];
    const permissions = userWithRoles?.permissions ?? [];

    const requestId = request.id;

    request.requestContext = {
      userId: user.id,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles,
      permissions,
      requestId,
    };
  };
};

export const createAuthorizeHook = (requiredPermissions: string[]) => {
  return async (request: FastifyRequest) => {
    const context = request.requestContext;
    const missingPermissions = requiredPermissions.filter(
      (permission) => !context.permissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      throw new PermissionDeniedError(
        `Missing required permissions: ${missingPermissions.join(', ')}`,
      );
    }
  };
};
