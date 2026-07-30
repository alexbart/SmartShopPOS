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
      select: { id: true, status: true },
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
        oldValues: _model.oldValues,
        newValues: _model.newValues,
        ipAddress: _model.ipAddress,
        userAgent: _model.userAgent,
        requestId: _model.requestId,
        branchId: _model.branchId,
        roleId: _model.roleId,
      },
    });
  }
}
