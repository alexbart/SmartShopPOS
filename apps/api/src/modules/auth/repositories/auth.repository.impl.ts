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
import type { FindUsersQuery } from './models/find-users.query.js';
import type { UpdateUserModel } from './models/update-user.model.js';
import type { ResetPasswordModel } from './models/reset-password.model.js';

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

  async findUserWithRolesById(
    _userId: string,
  ): Promise<{ id: string; email: string; roles: string[]; permissions: string[] } | null> {
    const user = await this._prisma.user.findFirst({
      where: { id: _userId, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const roles = user.roles.map((userRole) => userRole.role.name);
    const permissions = user.roles.flatMap((userRole) =>
      userRole.role.permissions.map((rp) => rp.permission.name),
    );

    return {
      id: user.id,
      email: user.email,
      roles,
      permissions,
    };
  }

  async findUsers(_query: FindUsersQuery) {
    const {
      organizationId,
      page = 1,
      limit = 20,
      search,
      status,
      roleId,
      branchId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = _query;

    const where: Record<string, unknown> = {
      organizationId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (roleId) {
      where.roles = {
        some: { roleId },
      };
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    const validSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt'];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this._prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: { select: { name: true } },
          roles: {
            include: {
              role: { select: { name: true } },
            },
          },
        },
      }),
      this._prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.roles[0]?.role.name ?? null,
        branch: user.branch?.name ?? null,
        branchId: user.branchId,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateUser(_model: UpdateUserModel) {
    const { userId, organizationId, updatedBy: _updatedBy, roleId, ...data } = _model;

    const user = await this._prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updateData: Record<string, unknown> = { ...data, updatedBy: _updatedBy };

    if (data.email) {
      data.email = data.email.toLowerCase();
    }

    if (data.isActive !== undefined) {
      data.status = data.isActive ? 'ACTIVE' : 'INACTIVE';
      delete data.isActive;
    }

    if (roleId) {
      // Remove existing roles
      await this._prisma.userRole.deleteMany({
        where: { userId },
      });
      // Assign new role
      await this._prisma.userRole.create({
        data: { userId, roleId },
      });
    }

    // Remove updatedBy as it's not a field in the User model - we use updatedAt instead
    const dataToUpdate = { ...updateData };
    delete dataToUpdate.updatedBy;
    dataToUpdate.updatedAt = new Date();

    await this._prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });
  }

  async deactivateUser(_userId: string, _deactivatedBy: string) {
    const user = await this._prisma.user.findFirst({
      where: { id: _userId, deletedAt: null },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this._prisma.user.update({
      where: { id: _userId },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    // Revoke all sessions
    await this._prisma.session.updateMany({
      where: { userId: _userId, status: 'ACTIVE' },
      data: { status: 'LOGGED_OUT', lastActivityAt: new Date() },
    });
  }

  async resetPassword(_model: ResetPasswordModel) {
    const { userId, organizationId, newPassword } = _model;

    const user = await this._prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password
    const { PasswordService } =
      await import('../../../shared/services/password/password.service.js');
    const passwordService = new PasswordService();
    const passwordHash = await passwordService.hash(newPassword);

    await this._prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Revoke all sessions except current one
    await this._prisma.session.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'LOGGED_OUT', lastActivityAt: new Date() },
    });
  }
}
