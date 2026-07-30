export interface UpdateUnitCommand {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  abbreviation?: string;
  isActive?: boolean;
  updatedBy?: string;
}
