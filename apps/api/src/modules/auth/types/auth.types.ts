import type { RegisterCommand } from '../commands/register.command.js';
import type { LoginCommand } from '../commands/login.command.js';
import type { RegisterResponse } from '../responses/register.response.js';
import type { RefreshResponse } from '../responses/refresh.response.js';
import type { MeResponse } from '../responses/me.response.js';
import type { FindUsersQuery } from '../repositories/models/find-users.query.js';
import type { UpdateUserModel } from '../repositories/models/update-user.model.js';
import type { ResetPasswordModel } from '../repositories/models/reset-password.model.js';

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
    roleId?: string;
    isActive?: boolean;
    createdBy: string;
  }): Promise<{ userId: string }>;
  updateUser(_command: UpdateUserModel): Promise<void>;
  deactivateUser(_userId: string, _organizationId: string, _deactivatedBy: string): Promise<void>;
  resetPassword(_command: ResetPasswordModel): Promise<void>;
}
