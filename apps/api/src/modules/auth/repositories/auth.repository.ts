import { PrismaClient, UserStatus, SessionStatus, AuditAction } from '@prisma/client';
import type { IAuthRepository } from '../types/auth.types.js';

export class AuthRepository implements IAuthRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async findOrganizationByCode(code: string) {
    const organization = await this._prisma.organization.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
      select: { id: true, status: true },
    });

    return organization;
  }

  async findUserByEmail(organizationId: string, email: string) {
    const user = await this._prisma.user.findFirst({
      where: { organizationId, email: email.toLowerCase(), deletedAt: null },
      select: { id: true },
    });

    return user;
  }

  async createOrganization(data: {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    kraPin?: string;
  }) {
    const organization = await this._prisma.organization.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        email: data.email?.toLowerCase(),
        phone: data.phone,
        kraPin: data.kraPin,
      },
      select: { id: true },
    });

    return organization.id;
  }

  async createUser(data: {
    organizationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }) {
    const user = await this._prisma.user.create({
      data: {
        organizationId: data.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash: data.passwordHash,
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
    });

    return user.id;
  }

  async assignRole(userId: string, roleId: string) {
    await this._prisma.userRole.create({
      data: { userId, roleId },
    });
  }

  async createSession(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const session = await this._prisma.session.create({
      data: {
        organizationId: data.userId,
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
        lastActivityAt: new Date(),
        status: SessionStatus.ACTIVE,
      },
      select: { id: true },
    });

    return session.id;
  }

  async createAuditLog(data: {
    organizationId: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this._prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        action: data.action as AuditAction,
        entity: data.entity,
        entityId: data.entityId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}
