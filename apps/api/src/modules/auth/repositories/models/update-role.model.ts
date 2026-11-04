export interface UpdateRoleModel {
  id: string;
  organizationId: string;
  name?: string;
  description?: string;
  permissionIds?: string[];
  updatedBy: string;
}
