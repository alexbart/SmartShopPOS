export interface CreateBrandCommand {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  createdBy?: string;
}
