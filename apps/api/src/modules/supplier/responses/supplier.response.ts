export interface SupplierResponse {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxPin?: string;
  creditLimit?: number;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
