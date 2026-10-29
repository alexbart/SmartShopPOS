export interface UpdateWarehouseCommand {
  id: string;
  organizationId: string;
  code?: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
}
