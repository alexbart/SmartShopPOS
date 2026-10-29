import { z } from 'zod';

export const adjustStockSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z
    .number()
    .int()
    .refine((value) => value !== 0, {
      message: 'Adjustment quantity cannot be zero',
    }),
  type: z.enum(['ADJUSTMENT', 'DAMAGE', 'EXPIRED']),
  remarks: z.string().trim().min(3).max(500),
});

export type AdjustStockSchema = z.infer<typeof adjustStockSchema>;
