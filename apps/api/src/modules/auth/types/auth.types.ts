import type { RegisterCommand } from '../commands/register.command.js';
import type { LoginCommand } from '../commands/login.command.js';
import type { RegisterResponse } from '../responses/register.response.js';
import type { RefreshResponse } from '../responses/refresh.response.js';
import type { MeResponse } from '../responses/me.response.js';
import type { FindUsersQuery } from '../repositories/models/find-users.query.js';
import type { UpdateUserModel } from '../repositories/models/update-user.model.js';
import type { ResetPasswordModel } from '../repositories/models/reset-password.model.js';
import type { FindRolesQuery } from '../repositories/models/find-roles.query.js';
import type { UpdateRoleModel } from '../repositories/models/update-role.model.js';

export interface IAuthService {
  register(_data: RegisterCommand): Promise<RegisterResponse>;
  login(_data: LoginCommand): Promise<RegisterResponse>;
  refresh(_refreshToken: string): Promise<RefreshResponse>;
  me(_userId: string): Promise<MeResponse>;
  logout(_refreshToken: string): Promise<void>;
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
  createUser(_command: {
    organizationId: string;
    branchId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    roleId: string;
    isActive?: boolean;
    createdBy: string;
  }): Promise<{ userId: string }>;
  updateUser(_command: UpdateUserModel): Promise<void>;
  deactivateUser(_userId: string, _organizationId: string, _deactivatedBy: string): Promise<void>;
  resetPassword(_command: ResetPasswordModel): Promise<void>;
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
  createRole(_command: {
    organizationId: string;
    name: string;
    description?: string;
    permissionIds?: string[];
    createdBy: string;
  }): Promise<{ id: string }>;
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
  updateRole(_command: UpdateRoleModel): Promise<void>;
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
}
