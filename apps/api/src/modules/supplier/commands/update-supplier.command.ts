export interface UpdateSupplierCommand {
  id: string;
  organizationId: string;
  code?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxPin?: string;
  creditLimit?: number | null;
  paymentTerms?: string | null;
  isActive?: boolean;
}
