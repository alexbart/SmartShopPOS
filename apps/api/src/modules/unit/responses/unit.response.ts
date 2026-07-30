export interface UnitResponse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  abbreviation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
