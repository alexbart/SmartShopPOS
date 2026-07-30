export interface CreateTaxCommand {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  rate: number;
  createdBy?: string;
}
