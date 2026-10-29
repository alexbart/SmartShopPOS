import type { CreateCategoryDto } from '../dto/create-category.dto.js';
import type { CreateCategoryCommand } from '../commands/create-category.command.js';

export function toCreateCategoryCommand(
  dto: CreateCategoryDto,
  organizationId: string,
  createdBy?: string,
): CreateCategoryCommand {
  return {
    organizationId,
    name: dto.name.trim(),
    code: dto.code.trim().toUpperCase(),
    description: dto.description?.trim(),
    color: dto.color?.trim(),
    createdBy,
  };
}
