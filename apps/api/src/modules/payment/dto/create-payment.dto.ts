export interface CreatePaymentDto {
  saleId: string;
  method: 'CASH' | 'MPESA' | 'CARD' | 'BANK' | 'CREDIT';
  amount: number;
  reference?: string;
}
