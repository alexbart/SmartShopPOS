import type { RegisterDTO, RegisterCommand } from './register.dto.js';

export function toRegisterCommand(dto: RegisterDTO): RegisterCommand {
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
