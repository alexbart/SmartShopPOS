export interface CreateCustomerDto {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  taxPin?: string;
  address?: string;
  creditLimit?: number;
}
