export interface UpdateBrandCommand {
  id: string;
  organizationId: string;
  name?: string;
  code?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
  updatedBy?: string;
}
