export interface CreateSupplierDto {
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxPin?: string;
  creditLimit?: number;
  paymentTerms?: string;
}
