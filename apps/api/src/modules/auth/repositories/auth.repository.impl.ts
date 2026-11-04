import { Prisma, PrismaClient, UserStatus, SessionStatus, AuditAction } from '@prisma/client';
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
import type { FindUsersQuery } from './models/find-users.query.js';
import type { FindRolesQuery } from './models/find-roles.query.js';
import type { CreateRoleModel } from './models/create-role.model.js';
import type { UpdateRoleModel } from './models/update-role.model.js';
import type { UpdateUserModel } from './models/update-user.model.js';
import type { ResetPasswordModel } from './models/reset-password.model.js';
import type { AssignPermissionToRoleModel } from './models/assign-permission-to-role.model.js';
import type { SyncRolePermissionsModel } from './models/sync-role-permissions.model.js';

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

  async findRoleByName(_query: FindRoleByNameQuery): Promise<{ id: string } | null> {
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
        oldValues: (_model.oldValues as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newValues: (_model.newValues as Prisma.InputJsonValue) ?? Prisma.JsonNull,
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
      data: { status: 'LOGGED_OUT', lastActivityAt: new Date() },
    });
  }

  async findUserById(_userId: string) {
    const user = await this._prisma.user.findFirst({
      where: { id: _userId, deletedAt: null },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      organizationId: user.organizationId,
      branchId: user.branchId,
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
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
    if (!user) return null;
    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );
    return { id: user.id, email: user.email, roles, permissions };
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
    const where: Record<string, unknown> = { organizationId, deletedAt: null };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status.toUpperCase();
    if (branchId) where.branchId = branchId;
    if (roleId) where.roles = { some: { roleId } };
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    const validSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt'];
    if (validSortFields.includes(sortBy)) orderBy[sortBy] = sortOrder;
    else orderBy.createdAt = 'desc';
    const [items, total] = await Promise.all([
      this._prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: { select: { name: true } },
          roles: { include: { role: { select: { name: true } } } },
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
        branchName: user.branch?.name ?? null,
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
    const { userId, organizationId, updatedBy, roleId, ...data } = _model;
    const user = await this._prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });
    if (!user) throw new Error('User not found');
    if (data.email) data.email = data.email.toLowerCase();
    const { isActive, ...userData } = data;
    const updateData: Record<string, unknown> = {
      ...userData,
      ...(isActive !== undefined
        ? { status: isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE }
        : {}),
      updatedBy,
    };
    if (roleId) {
      await this._prisma.userRole.deleteMany({ where: { userId } });
      await this._prisma.userRole.create({ data: { userId, roleId } });
    }
    const dataToUpdate = { ...updateData };
    delete dataToUpdate.updatedBy;
    dataToUpdate.updatedAt = new Date();
    await this._prisma.user.update({ where: { id: userId }, data: dataToUpdate });
  }

  async deactivateUser(_userId: string, _deactivatedBy: string) {
    const user = await this._prisma.user.findFirst({ where: { id: _userId, deletedAt: null } });
    if (!user) throw new Error('User not found');
    await this._prisma.user.update({
      where: { id: _userId },
      data: { status: UserStatus.INACTIVE, updatedAt: new Date() },
    });
    await this._prisma.session.updateMany({
      where: { userId: _userId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.LOGGED_OUT, lastActivityAt: new Date() },
    });
  }

  async resetPassword(_model: ResetPasswordModel) {
    const { userId, organizationId, newPassword } = _model;
    const user = await this._prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });
    if (!user) throw new Error('User not found');
    const { PasswordService } =
      await import('../../../shared/services/password/password.service.js');
    const passwordService = new PasswordService();
    const passwordHash = await passwordService.hash(newPassword);
    await this._prisma.user.update({
      where: { id: userId },
      data: { passwordHash, updatedAt: new Date() },
    });
    await this._prisma.session.updateMany({
      where: { userId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.LOGGED_OUT, lastActivityAt: new Date() },
    });
  }

  private _parsePermissionName(name: string): { resource: string; action: string } {
    const parts = name.split(':');
    if (parts.length === 2) return { resource: parts[0], action: parts[1] };
    return { resource: name.split('.')[0] || 'unknown', action: name.split('.')[1] || name };
  }

  async findRoles(_query: FindRolesQuery) {
    const {
      organizationId,
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = _query;
    const where: Record<string, unknown> = {
      deletedAt: null,
      OR: [{ organizationId }, { isSystem: true }],
    };
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    if (validSortFields.includes(sortBy)) orderBy[sortBy] = sortOrder;
    else orderBy.createdAt = 'desc';
    const [items, total] = await Promise.all([
      this._prisma.role.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      }),
      this._prisma.role.count({ where }),
    ]);
    return {
      items: items.map((role) => {
        const permissions = role.permissions.map((rp) => {
          const { resource, action } = this._parsePermissionName(rp.permission.name);
          return {
            id: rp.permission.id,
            name: rp.permission.name,
            resource,
            action,
          };
        });
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          userCount: role._count.users,
          permissions,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        };
      }),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async createRole(_model: CreateRoleModel) {
    const role = await this._prisma.role.create({
      data: {
        organizationId: _model.organizationId,
        name: _model.name,
        description: _model.description,
      },
      select: { id: true },
    });
    if (_model.permissionIds?.length) {
      for (const permissionId of _model.permissionIds) {
        await this._prisma.rolePermission.create({ data: { roleId: role.id, permissionId } });
      }
    }
    return role.id;
  }

  async findRoleById(_id: string, _organizationId: string) {
    const role = await this._prisma.role.findFirst({
      where: {
        id: _id,
        deletedAt: null,
        OR: [{ organizationId: _organizationId }, { isSystem: true }],
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    if (!role) return null;
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => {
        const { resource, action } = this._parsePermissionName(rp.permission.name);
        return { id: rp.permission.id, name: rp.permission.name, resource, action };
      }),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async updateRole(_model: UpdateRoleModel) {
    await this._prisma.role.update({
      where: { id: _model.id, organizationId: _model.organizationId },
      data: { name: _model.name, description: _model.description },
    });
  }

  async deleteRole(_id: string, _organizationId: string, _deactivatedBy: string) {
    await this._prisma.role.update({
      where: { id: _id, organizationId: _organizationId },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
  }

  async findPermissions() {
    const permissions = await this._prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
    return permissions.map((p) => {
      const { resource, action } = this._parsePermissionName(p.name);
      return { id: p.id, name: p.name, resource, action, description: p.description };
    });
  }

  async assignPermissionToRole(_model: AssignPermissionToRoleModel) {
    await this._prisma.rolePermission.create({
      data: { roleId: _model.roleId, permissionId: _model.permissionId },
    });
  }

  async syncRolePermissions(_model: SyncRolePermissionsModel) {
    await this._prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: _model.roleId } });
      if (_model.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: _model.permissionIds.map((permissionId: string) => ({
            roleId: _model.roleId,
            permissionId,
          })),
        });
      }
    });
  }
}
