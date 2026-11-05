export interface CreateRoleModel {
  organizationId: string;
  name: string;
  description?: string;
  permissionIds?: string[];
  createdBy: string;
}
