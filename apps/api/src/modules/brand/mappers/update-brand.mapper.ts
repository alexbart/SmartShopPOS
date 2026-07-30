import type { UpdateBrandDto } from '../dto/update-brand.dto.js';
import type { UpdateBrandCommand } from '../commands/update-brand.command.js';

export function toUpdateBrandCommand(
  dto: UpdateBrandDto,
  id: string,
  organizationId: string,
  updatedBy?: string,
): UpdateBrandCommand {
  return {
    id,
    organizationId,
    name: dto.name?.trim(),
    code: dto.code?.trim().toUpperCase(),
    description: dto.description?.trim(),
    logoUrl: dto.logoUrl?.trim(),
    website: dto.website?.trim(),
    isActive: dto.isActive,
    updatedBy,
  };
}
