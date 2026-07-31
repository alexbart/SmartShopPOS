export interface CreateWarehouseCommand {
  organizationId: string;
  branchId: string;
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}
