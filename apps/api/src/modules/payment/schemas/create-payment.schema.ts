import { z } from 'zod';

export const createPaymentSchema = z.object({
  saleId: z.string().uuid(),
  method: z.enum(['CASH', 'MPESA', 'CARD', 'BANK', 'CREDIT']),
  amount: z
    .number()
    .finite('Amount must be a finite number.')
    .positive('Amount must be greater than zero.'),
  reference: z.string().optional(),
  idempotencyKey: z.string().max(255).optional(),
});

export type CreatePaymentSchema = z.infer<typeof createPaymentSchema>;
