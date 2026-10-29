import { z } from 'zod';

export const createReceiptSchema = z.object({
  saleId: z.string().uuid(),
});

export type CreateReceiptSchema = z.infer<typeof createReceiptSchema>;
