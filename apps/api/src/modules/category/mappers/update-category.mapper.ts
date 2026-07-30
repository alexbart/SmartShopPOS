import type { UpdateCategoryDto } from '../dto/update-category.dto.js';
import type { UpdateCategoryCommand } from '../commands/update-category.command.js';

export function toUpdateCategoryCommand(
  dto: UpdateCategoryDto,
  id: string,
  organizationId: string,
  updatedBy?: string,
): UpdateCategoryCommand {
  return {
    id,
    organizationId,
    name: dto.name?.trim(),
    code: dto.code?.trim().toUpperCase(),
    description: dto.description?.trim(),
    color: dto.color?.trim(),
    isActive: dto.isActive,
    updatedBy,
  };
}
