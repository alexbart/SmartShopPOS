import type { RegisterCommand } from '../commands/register.command.js';
import type { LoginCommand } from '../commands/login.command.js';
import type { RegisterResponse } from '../responses/register.response.js';
import type { RefreshResponse } from '../responses/refresh.response.js';
import type { MeResponse } from '../responses/me.response.js';

export interface IAuthService {
  register(_data: RegisterCommand): Promise<RegisterResponse>;
  login(_data: LoginCommand): Promise<RegisterResponse>;
  refresh(_refreshToken: string): Promise<RefreshResponse>;
  me(_userId: string): Promise<MeResponse>;
  logout(_refreshToken: string): Promise<void>;
}
