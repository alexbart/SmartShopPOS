import type { CreateBrandDto } from '../dto/create-brand.dto.js';
import type { CreateBrandCommand } from '../commands/create-brand.command.js';

export function toCreateBrandCommand(
  dto: CreateBrandDto,
  organizationId: string,
  createdBy?: string,
): CreateBrandCommand {
  return {
    organizationId,
    name: dto.name.trim(),
    code: dto.code.trim().toUpperCase(),
    description: dto.description?.trim(),
    logoUrl: dto.logoUrl?.trim(),
    website: dto.website?.trim(),
    createdBy,
  };
}
