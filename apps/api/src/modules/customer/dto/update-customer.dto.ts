export interface UpdateCustomerDto {
  code?: string;
  name?: string;
  phone?: string;
  email?: string;
  taxPin?: string;
  address?: string;
  creditLimit?: number;
  isActive?: boolean;
}
