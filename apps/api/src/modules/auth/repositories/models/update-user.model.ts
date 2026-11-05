export interface UpdateUserModel {
  userId: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  branchId?: string;
  isActive?: boolean;
  roleId?: string;
  updatedBy: string;
}
