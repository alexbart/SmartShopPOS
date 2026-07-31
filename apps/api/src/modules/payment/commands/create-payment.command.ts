export interface CreatePaymentCommand {
  organizationId: string;
  saleId: string;
  method: 'CASH' | 'MPESA' | 'CARD' | 'BANK' | 'CREDIT';
  amount: number;
  reference?: string;
}
