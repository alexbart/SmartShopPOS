export interface UpdateCategoryCommand {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  updatedBy?: string;
}
