export interface CreateCategoryCommand {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  createdBy?: string;
}
