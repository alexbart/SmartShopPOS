import { z } from 'zod';

export const createPaymentSchema = z.object({
  saleId: z.string().uuid(),
  method: z.enum(['CASH', 'MPESA', 'CARD', 'BANK', 'CREDIT']),
  amount: z.number().positive('Amount must be positive'),
  reference: z.string().optional(),
});

export type CreatePaymentSchema = z.infer<typeof createPaymentSchema>;
