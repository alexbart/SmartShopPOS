export interface PaymentResponse {
  id: string;
  organizationId: string;
  saleId: string;
  method: string;
  amount: number;
  reference?: string;
  status: string;
  paidAt?: Date;
  createdAt: Date;
}
