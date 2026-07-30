import type { RegisterDto } from '../dto/register.dto.js';
import type { RegisterCommand } from '../commands/register.command.js';

export class RegisterMapper {
  static toRegisterCommand(dto: RegisterDto): RegisterCommand {
    return {
      organizationName: dto.organizationName.trim(),
      ownerFirstName: dto.ownerFirstName.trim(),
      ownerLastName: dto.ownerLastName.trim(),
      ownerEmail: dto.ownerEmail.trim(),
      ownerPhone: dto.ownerPhone?.trim(),
      plainPassword: dto.password,
    };
  }
}
