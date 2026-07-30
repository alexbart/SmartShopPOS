import type { RegisterRequest } from '../dto/register.dto.js';
import type { LoginRequest } from '../dto/login.dto.js';

export interface IAuthRepository {
  findOrganizationByCode(_code: string): Promise<{ id: string; status: string } | null>;
  findUserByEmail(_organizationId: string, _email: string): Promise<{ id: string } | null>;
  createOrganization(_data: {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    kraPin?: string;
  }): Promise<string>;
  createUser(_data: {
    organizationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }): Promise<string>;
  assignRole(_userId: string, _roleId: string): Promise<void>;
  createSession(_data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string>;
  createAuditLog(_data: {
    organizationId: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
}

export interface IAuthService {
  register(
    _data: RegisterRequest,
  ): Promise<{ userId: string; organizationId: string; accessToken: string; refreshToken: string }>;
  login(
    _data: LoginRequest,
  ): Promise<{ userId: string; organizationId: string; accessToken: string; refreshToken: string }>;
  refresh(
    _refreshToken: string,
  ): Promise<{ userId: string; organizationId: string; accessToken: string; refreshToken: string }>;
  logout(_userId: string, _sessionId: string): Promise<void>;
}
