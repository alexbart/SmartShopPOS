import { PrismaClient, UserStatus, SessionStatus, AuditAction } from '@prisma/client';
import type { IAuthRepository } from './auth.repository.js';
import type { CreateOrganizationModel } from './models/create-organization.model.js';
import type { CreateBranchModel } from './models/create-branch.model.js';
import type { CreateUserModel } from './models/create-user.model.js';
import type { AssignRoleModel } from './models/assign-role.model.js';
import type { CreateSessionModel } from './models/create-session.model.js';
import type { CreateAuditLogModel } from './models/create-audit-log.model.js';
import type { FindOrganizationByNameQuery } from './models/find-organization-by-name.query.js';
import type { FindOrganizationByCodeQuery } from './models/find-organization-by-code.query.js';
import type { FindUserByEmailQuery } from './models/find-user-by-email.query.js';
import type { FindRoleByNameQuery } from './models/find-role-by-name.query.js';

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async findOrganizationByName(_query: FindOrganizationByNameQuery) {
    const organization = await this._prisma.organization.findFirst({
      where: { name: _query.name, deletedAt: null },
      select: { id: true, code: true },
    });

    return organization;
  }

  async findOrganizationByCode(_query: FindOrganizationByCodeQuery) {
    const organization = await this._prisma.organization.findFirst({
      where: { code: _query.code.toUpperCase(), deletedAt: null },
      select: { id: true, code: true, name: true, status: true },
    });

    return organization;
  }

  async findUserByEmail(_query: FindUserByEmailQuery) {
    const user = await this._prisma.user.findFirst({
      where: {
        organizationId: _query.organizationId,
        email: _query.email.toLowerCase(),
        deletedAt: null,
      },
      select: { id: true },
    });

    return user;
  }

  async findRoleByName(_query: FindRoleByNameQuery) {
    const role = await this._prisma.role.findFirst({
      where: { name: _query.name, deletedAt: null },
      select: { id: true },
    });

    return role;
  }

  async createOrganization(_model: CreateOrganizationModel) {
    const organization = await this._prisma.organization.create({
      data: {
        name: _model.name,
        code: _model.code.toUpperCase(),
        email: _model.email?.toLowerCase(),
        phone: _model.phone,
        kraPin: _model.kraPin,
      },
      select: { id: true },
    });

    return organization.id;
  }

  async createBranch(_model: CreateBranchModel) {
    const branch = await this._prisma.branch.create({
      data: {
        organizationId: _model.organizationId,
        name: _model.name,
        code: _model.code,
        isHeadOffice: _model.isHeadOffice,
      },
      select: { id: true },
    });

    return branch.id;
  }

  async createUser(_model: CreateUserModel) {
    const user = await this._prisma.user.create({
      data: {
        organizationId: _model.organizationId,
        branchId: _model.branchId,
        firstName: _model.firstName,
        lastName: _model.lastName,
        email: _model.email.toLowerCase(),
        phone: _model.phone,
        passwordHash: _model.passwordHash,
        status: _model.isActive ? UserStatus.ACTIVE : UserStatus.PENDING,
      },
      select: { id: true },
    });

    return user.id;
  }

  async assignRole(_model: AssignRoleModel) {
    await this._prisma.userRole.create({
      data: { userId: _model.userId, roleId: _model.roleId },
    });
  }

  async createSession(_model: CreateSessionModel) {
    const session = await this._prisma.session.create({
      data: {
        organizationId: _model.organizationId,
        userId: _model.userId,
        branchId: _model.branchId,
        refreshTokenHash: _model.refreshTokenHash,
        ipAddress: _model.ipAddress,
        userAgent: _model.userAgent,
        expiresAt: _model.expiresAt,
        lastActivityAt: new Date(),
        status: SessionStatus.ACTIVE,
      },
      select: { id: true },
    });

    return session.id;
  }

  async createAuditLog(_model: CreateAuditLogModel) {
    await this._prisma.auditLog.create({
      data: {
        organizationId: _model.organizationId,
        actorId: _model.actorId,
        action: _model.action as AuditAction,
        entity: _model.entity,
        entityId: _model.entityId,
        oldValues: _model.oldValues as Record<string, unknown>,
        newValues: _model.newValues as Record<string, unknown>,
        ipAddress: _model.ipAddress,
        userAgent: _model.userAgent,
        requestId: _model.requestId,
        branchId: _model.branchId,
        roleId: _model.roleId,
      },
    });
  }

  async updateLastLogin(_userId: string) {
    await this._prisma.user.update({
      where: { id: _userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async findUserByOrganizationAndEmail(_organizationId: string, _email: string) {
    const user = await this._prisma.user.findFirst({
      where: { organizationId: _organizationId, email: _email.toLowerCase(), deletedAt: null },
      select: {
        id: true,
        passwordHash: true,
        status: true,
        branchId: true,
        firstName: true,
        lastName: true,
      },
    });

    return user;
  }

  async findSessionById(_sessionId: string) {
    const session = await this._prisma.session.findFirst({
      where: { id: _sessionId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        branchId: true,
        refreshTokenHash: true,
        status: true,
        expiresAt: true,
      },
    });

    return session;
  }

  async updateSessionRefreshToken(_sessionId: string, _refreshTokenHash: string) {
    await this._prisma.session.update({
      where: { id: _sessionId },
      data: { refreshTokenHash: _refreshTokenHash, lastActivityAt: new Date() },
    });
  }

  async revokeSession(_sessionId: string) {
    await this._prisma.session.update({
      where: { id: _sessionId },
      data: { status: SessionStatus.LOGGED_OUT, lastActivityAt: new Date() },
    });
  }

  async findUserById(_userId: string) {
    const user = await this._prisma.user.findFirst({
      where: { id: _userId, deletedAt: null },
      include: {
        organization: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      organizationId: user.organization.id,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        code: user.organization.code,
      },
      branchId: user.branch.id,
      branch: { id: user.branch.id, name: user.branch.name, code: user.branch.code },
    };
  }

  async findUserWithRolesById(_userId: string) {
    const user = await this._prisma.user.findFirst({
      where: { id: _userId, deletedAt: null },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const roles = user.roles.map((userRole) => userRole.role.name);

    return {
      id: user.id,
      email: user.email,
      roles,
    };
  }
}
