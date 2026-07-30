import type { RegisterCommand } from '../commands/register.command.js';
import type { LoginRequest } from '../dto/login.dto.js';
import type { RegisterResponse } from '../responses/register.response.js';

export interface IAuthService {
  register(_data: RegisterCommand): Promise<RegisterResponse>;
  login(
    _data: LoginRequest,
  ): Promise<{ userId: string; organizationId: string; accessToken: string; refreshToken: string }>;
  refresh(
    _refreshToken: string,
  ): Promise<{ userId: string; organizationId: string; accessToken: string; refreshToken: string }>;
  logout(_userId: string, _sessionId: string): Promise<void>;
}
