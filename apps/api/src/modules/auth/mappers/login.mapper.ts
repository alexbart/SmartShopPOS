import type { LoginDto } from '../dto/login.dto.js';
import type { LoginCommand } from '../commands/login.command.js';

export function toLoginCommand(dto: LoginDto): LoginCommand {
  return {
    organizationCode: dto.organizationCode.trim(),
    email: dto.email.trim(),
    plainPassword: dto.password,
  };
}
