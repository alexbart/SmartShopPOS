export interface CustomerResponse {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  taxPin?: string;
  address?: string;
  loyaltyPoints: number;
  creditLimit?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
