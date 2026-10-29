export interface TaxResponse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  rate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
