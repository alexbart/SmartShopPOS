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

export interface IAuthRepository {
  findOrganizationByName(
    _query: FindOrganizationByNameQuery,
  ): Promise<{ id: string; code: string } | null>;
  findOrganizationByCode(
    _query: FindOrganizationByCodeQuery,
  ): Promise<{ id: string; code: string; name: string; status: string } | null>;
  findUserByEmail(_query: FindUserByEmailQuery): Promise<{ id: string } | null>;
  findRoleByName(_query: FindRoleByNameQuery): Promise<{ id: string } | null>;
  createOrganization(_model: CreateOrganizationModel): Promise<string>;
  createBranch(_model: CreateBranchModel): Promise<string>;
  createUser(_model: CreateUserModel): Promise<string>;
  assignRole(_model: AssignRoleModel): Promise<void>;
  createSession(_model: CreateSessionModel): Promise<string>;
  createAuditLog(_model: CreateAuditLogModel): Promise<void>;
  updateLastLogin(_userId: string): Promise<void>;
  findUserByOrganizationAndEmail(
    _organizationId: string,
    _email: string,
  ): Promise<{
    id: string;
    passwordHash: string;
    status: string;
    branchId: string;
    firstName: string;
    lastName: string;
  } | null>;
  findSessionById(_sessionId: string): Promise<{
    id: string;
    userId: string;
    organizationId: string;
    branchId: string;
    refreshTokenHash: string;
    status: string;
    expiresAt: Date;
  } | null>;
  updateSessionRefreshToken(_sessionId: string, _refreshTokenHash: string): Promise<void>;
  revokeSession(_sessionId: string): Promise<void>;
  findUserById(_userId: string): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    organizationId: string;
    branchId: string;
  } | null>;
  findUserWithRolesById(
    _userId: string,
  ): Promise<{ id: string; email: string; roles: string[]; permissions: string[] } | null>;
  findUserAuditSnapshot(
    _userId: string,
    _organizationId: string,
  ): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    branchId: string;
    status: string;
    roles: string[];
  } | null>;
  findUsers(_query: FindUsersQuery): Promise<{
    items: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      status: string;
      role: string | null;
      branchName: string | null;
      lastLoginAt: Date | null;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>;
  updateUser(_model: UpdateUserModel): Promise<void>;
  deactivateUser(_userId: string, _deactivatedBy: string): Promise<void>;
  resetPassword(_model: ResetPasswordModel): Promise<void>;
  findUserById(_userId: string): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    organizationId: string;
    branchId: string;
  } | null>;
  findUserWithRolesById(
    _userId: string,
  ): Promise<{ id: string; email: string; roles: string[]; permissions: string[] } | null>;
  findRoles(_query: FindRolesQuery): Promise<{
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      isSystem: boolean;
      userCount: number;
      permissions: Array<{ id: string; name: string; resource: string; action: string }>;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    pages: number;
  }>;
  createRole(_model: CreateRoleModel): Promise<string>;
  findRoleById(
    _id: string,
    _organizationId: string,
  ): Promise<{
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    userCount: number;
    permissions: Array<{ id: string; name: string; resource: string; action: string }>;
    createdAt: Date;
    updatedAt: Date;
  } | null>;
  updateRole(_model: UpdateRoleModel): Promise<void>;
  deleteRole(_id: string, _organizationId: string, _deactivatedBy: string): Promise<void>;
  findPermissions(_organizationId: string): Promise<
    Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
      description: string | null;
    }>
  >;
  assignPermissionToRole(_model: AssignPermissionToRoleModel): Promise<void>;
  syncRolePermissions(_model: SyncRolePermissionsModel): Promise<void>;
}
