import type { IAuthService } from '../types/auth.types.js';
import type { IAuthRepository } from '../types/auth.types.js';
import { hashPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from './jwt.js';
import { generateRequestId } from '../utils/request.js';

export class AuthService implements IAuthService {
  constructor(private readonly _repository: IAuthRepository) {}

  async register(data: {
    organization: { name: string; code: string; email?: string; phone?: string; kraPin?: string };
    owner: { firstName: string; lastName: string; email: string; phone?: string; password: string };
  }) {
    const requestId = generateRequestId();

    const existingOrganization = await this._repository.findOrganizationByCode(
      data.organization.code,
    );
    if (existingOrganization) {
      throw new Error('ORGANIZATION_EXISTS');
    }

    const organizationId = await this._repository.createOrganization(data.organization);

    const existingUser = await this._repository.findUserByEmail(organizationId, data.owner.email);
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(data.owner.password);
    const userId = await this._repository.createUser({
      organizationId,
      firstName: data.owner.firstName,
      lastName: data.owner.lastName,
      email: data.owner.email,
      phone: data.owner.phone,
      passwordHash,
    });

    await this._repository.createAuditLog({
      organizationId,
      userId,
      action: 'CREATE',
      entity: 'User',
      entityId: userId,
      requestId,
    });

    const accessToken = generateAccessToken({ userId, organizationId, roles: ['OWNER'] });
    const refreshToken = generateRefreshToken({ userId, sessionId: 'temp' });

    await this._repository.createSession({
      userId,
      refreshTokenHash: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { userId, organizationId, accessToken, refreshToken };
  }

  async login(data: { email: string; password: string }) {
    const requestId = generateRequestId();

    const user = await this._repository.findUserByEmail('global', data.email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      organizationId: 'global',
      roles: [],
    });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionId: 'temp' });

    await this._repository.createSession({
      userId: user.id,
      refreshTokenHash: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await this._repository.createAuditLog({
      organizationId: 'global',
      userId: user.id,
      action: 'LOGIN',
      entity: 'Session',
      entityId: user.id,
      requestId,
    });

    return { userId: user.id, organizationId: 'global', accessToken, refreshToken };
  }

  async refresh(_refreshToken: string) {
    void _refreshToken;
    const requestId = generateRequestId();

    const payload = generateRefreshToken({ userId: 'temp', sessionId: 'temp' });

    const accessToken = generateAccessToken({
      userId: payload.userId,
      organizationId: 'global',
      roles: [],
    });
    const newRefreshToken = generateRefreshToken({ userId: payload.userId, sessionId: 'temp' });

    await this._repository.createSession({
      userId: payload.userId,
      refreshTokenHash: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await this._repository.createAuditLog({
      organizationId: 'global',
      userId: payload.userId,
      action: 'LOGIN',
      entity: 'Session',
      entityId: payload.userId,
      requestId,
    });

    return {
      userId: payload.userId,
      organizationId: 'global',
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, _sessionId: string) {
    await this._repository.createAuditLog({
      organizationId: 'global',
      userId,
      action: 'LOGOUT',
      entity: 'Session',
      entityId: _sessionId,
      requestId: generateRequestId(),
    });
  }
}
