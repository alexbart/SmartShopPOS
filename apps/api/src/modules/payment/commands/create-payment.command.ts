export interface CreatePaymentCommand {
  organizationId: string;
  saleId: string;
  saleNumber?: string; // used as AccountReference for STK push
  method: 'CASH' | 'MPESA' | 'CARD' | 'BANK' | 'CREDIT';
  amount: number;
  reference?: string;
  phone?: string; // required for MPESA
  idempotencyKey?: string;
}
