export interface CategoryResponse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
