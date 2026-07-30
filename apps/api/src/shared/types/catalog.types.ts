export interface CatalogEntity {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
