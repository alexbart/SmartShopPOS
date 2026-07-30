export interface BrandResponse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
