export interface WarehouseResponse {
  id: string;
  organizationId: string;
  branchId: string;
  code: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
