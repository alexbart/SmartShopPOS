export interface CreateUnitCommand {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  abbreviation?: string;
  createdBy?: string;
}
