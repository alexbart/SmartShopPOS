export interface CreateUserModel {
  organizationId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  isActive: boolean;
}
