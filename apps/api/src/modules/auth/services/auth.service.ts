import type { RegisterCommand } from '../commands/register.command.js';
import type { RegisterResponse } from '../responses/register.response.js';
import type { IAuthRepository } from '../repositories/auth.repository.js';
import type { IPasswordService } from '../../../shared/services/password/password.interface.js';
import type { IJwtService } from '../../../shared/services/jwt/jwt.interface.js';
import type { IOrganizationCodeService } from '../../../shared/services/organization-code/organization-code.interface.js';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import type { RefreshResponse } from '../responses/refresh.response.js';
import type { MeResponse } from '../responses/me.response.js';
import { generateRequestId } from '../utils/request.js';

export class AuthService {
  constructor(
    private readonly _repository: IAuthRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _jwtService: IJwtService,
    private readonly _organizationCodeService: IOrganizationCodeService,
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async register(command: RegisterCommand): Promise<RegisterResponse> {
    const requestId = generateRequestId();

    const organizationCode = await this._organizationCodeService.generate(command.organizationName);

    const existingOrganization = await this._repository.findOrganizationByCode({
      code: organizationCode,
    });
    if (existingOrganization) {
      const error = new Error('Organization already exists.') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'ORGANIZATION_ALREADY_EXISTS';
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await this._passwordService.hash(command.plainPassword);

    let organizationId!: string;
    let userId!: string;
    let sessionId!: string;
    let refreshToken!: string;

    await this._unitOfWork.execute(async (_tx: unknown) => {
      organizationId = await this._repository.createOrganization({
        name: command.organizationName,
        code: organizationCode,
      });

      const branchId = await this._repository.createBranch({
        organizationId,
        name: 'Head Office',
        code: 'HO-001',
        isHeadOffice: true,
      });

      const existingUser = await this._repository.findUserByEmail({
        organizationId,
        email: command.ownerEmail,
      });
      if (existingUser) {
        const error = new Error('Email already exists.') as Error & {
          code: string;
          statusCode: number;
        };
        error.code = 'EMAIL_EXISTS';
        error.statusCode = 409;
        throw error;
      }

      userId = await this._repository.createUser({
        organizationId,
        branchId,
        firstName: command.ownerFirstName,
        lastName: command.ownerLastName,
        email: command.ownerEmail,
        phone: command.ownerPhone,
        passwordHash,
        isActive: true,
      });

      const role = await this._repository.findRoleByName({ name: 'OWNER' });
      if (!role) {
        const error = new Error('OWNER role not found.') as Error & {
          code: string;
          statusCode: number;
        };
        error.code = 'ROLE_NOT_FOUND';
        error.statusCode = 500;
        throw error;
      }

      await this._repository.assignRole({
        userId,
        roleId: role.id,
      });

      const tempHash = crypto.randomUUID();
      sessionId = await this._repository.createSession({
        organizationId,
        userId,
        branchId,
        refreshTokenHash: tempHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      refreshToken = await this._jwtService.generateRefreshToken({
        userId,
        sessionId,
        jti: crypto.randomUUID(),
      });
      const refreshTokenHash = await this._passwordService.hash(refreshToken);

      await this._repository.updateSessionRefreshToken(sessionId, refreshTokenHash);

      await this._repository.createAuditLog({
        organizationId,
        actorId: userId,
        action: 'CREATE',
        entity: 'Organization',
        entityId: organizationId,
        requestId,
      });
    });

    const accessToken = await this._jwtService.generateAccessToken({
      userId,
      organizationId,
      roles: ['OWNER'],
    });

    return {
      organization: {
        id: organizationId,
        code: organizationCode,
        name: command.organizationName,
      },
      user: {
        id: userId,
        firstName: command.ownerFirstName,
        lastName: command.ownerLastName,
        email: command.ownerEmail,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    } as const;
  }

  async login(
    command: import('../commands/login.command.js').LoginCommand,
  ): Promise<RegisterResponse> {
    const organization = await this._repository.findOrganizationByCode({
      code: command.organizationCode,
    });
    if (!organization) {
      const error = new Error('Invalid credentials.') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    const user = await this._repository.findUserByOrganizationAndEmail(
      organization.id,
      command.email,
    );
    if (!user) {
      const error = new Error('Invalid credentials.') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await this._passwordService.verify(
      command.plainPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials.') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    if (user.status !== 'ACTIVE') {
      const error = new Error('User account is not active.') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'USER_NOT_ACTIVE';
      error.statusCode = 403;
      throw error;
    }

    const tempHash = crypto.randomUUID();
    const sessionId = await this._repository.createSession({
      organizationId: organization.id,
      userId: user.id,
      branchId: user.branchId,
      refreshTokenHash: tempHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const refreshToken = await this._jwtService.generateRefreshToken({
      userId: user.id,
      sessionId,
      jti: crypto.randomUUID(),
    });
    const refreshTokenHash = await this._passwordService.hash(refreshToken);
    await this._repository.updateSessionRefreshToken(sessionId, refreshTokenHash);

    const userWithRoles = await this._repository.findUserWithRolesById(user.id);
    const roles = userWithRoles?.roles ?? [];

    const accessToken = await this._jwtService.generateAccessToken({
      userId: user.id,
      organizationId: organization.id,
      roles,
    });

    return {
      user: {
        id: user.id,
        firstName: '',
        lastName: '',
        email: command.email,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    } as const;
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const requestId = generateRequestId();

    let payload: { userId: string; sessionId: string; jti: string };
    try {
      payload = await this._jwtService.verifyRefreshToken(refreshToken);
    } catch {
      const error = new Error('Invalid refresh token') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'INVALID_REFRESH_TOKEN';
      error.statusCode = 401;
      throw error;
    }

    const session = await this._repository.findSessionById(payload.sessionId);
    if (!session) {
      const error = new Error('Session not found') as Error & { code: string; statusCode: number };
      error.code = 'SESSION_NOT_FOUND';
      error.statusCode = 401;
      throw error;
    }

    if (session.status !== 'ACTIVE') {
      const error = new Error('Session is not active') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'SESSION_NOT_ACTIVE';
      error.statusCode = 401;
      throw error;
    }

    if (session.expiresAt < new Date()) {
      const error = new Error('Session expired') as Error & { code: string; statusCode: number };
      error.code = 'SESSION_EXPIRED';
      error.statusCode = 401;
      throw error;
    }

    const isTokenValid = await this._passwordService.verify(refreshToken, session.refreshTokenHash);
    if (!isTokenValid) {
      const error = new Error('Invalid refresh token') as Error & {
        code: string;
        statusCode: number;
      };
      error.code = 'INVALID_REFRESH_TOKEN';
      error.statusCode = 401;
      throw error;
    }

    const userWithRoles = await this._repository.findUserWithRolesById(session.userId);
    if (!userWithRoles) {
      const error = new Error('User not found') as Error & { code: string; statusCode: number };
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 401;
      throw error;
    }

    const newAccessToken = await this._jwtService.generateAccessToken({
      userId: session.userId,
      organizationId: session.organizationId,
      roles: userWithRoles.roles,
    });

    const newRefreshToken = await this._jwtService.generateRefreshToken({
      userId: session.userId,
      sessionId: session.id,
      jti: crypto.randomUUID(),
    });
    const newRefreshTokenHash = await this._passwordService.hash(newRefreshToken);

    await this._repository.updateSessionRefreshToken(session.id, newRefreshTokenHash);

    await this._repository.createAuditLog({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: 'LOGIN',
      entity: 'Session',
      entityId: session.id,
      requestId,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    } as const;
  }

  async me(userId: string): Promise<MeResponse> {
    const user = await this._repository.findUserById(userId);
    if (!user) {
      const error = new Error('User not found') as Error & { code: string; statusCode: number };
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const userWithRoles = await this._repository.findUserWithRolesById(userId);
    const roles = userWithRoles?.roles ?? [];

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      organization: {
        id: user.organizationId,
        name: '',
        code: '',
      },
      branch: {
        id: user.branchId,
        name: '',
        code: '',
      },
      roles,
    } as const;
  }

  async logout(refreshToken: string): Promise<void> {
    const requestId = generateRequestId();

    let payload: { userId: string; sessionId: string; jti: string };
    try {
      payload = await this._jwtService.verifyRefreshToken(refreshToken);
    } catch {
      return;
    }

    const session = await this._repository.findSessionById(payload.sessionId);
    if (session) {
      await this._repository.createAuditLog({
        organizationId: session.organizationId,
        actorId: session.userId,
        action: 'LOGOUT',
        entity: 'Session',
        entityId: session.id,
        requestId,
      });

      await this._repository.revokeSession(session.id);
    }
  }
}
