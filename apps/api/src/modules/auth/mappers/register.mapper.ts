import type { RegisterDTO } from '../dto/register.dto.js';
import type { RegisterCommand } from '../commands/register.command.js';

export class RegisterMapper {
  static toCommand(dto: RegisterDTO): RegisterCommand {
    return {
      organizationName: dto.organization.name.trim(),
      organizationEmail: dto.organization.email?.trim(),
      organizationPhone: dto.organization.phone?.trim(),
      kraPin: dto.organization.kraPin?.trim(),

      ownerFirstName: dto.owner.firstName.trim(),
      ownerLastName: dto.owner.lastName.trim(),
      ownerEmail: dto.owner.email.trim(),
      ownerPhone: dto.owner.phone?.trim(),

      plainPassword: dto.owner.password,
    };
  }
}
