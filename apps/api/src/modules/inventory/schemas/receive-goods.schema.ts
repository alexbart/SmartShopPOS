import { z } from 'zod';

export const receiveGoodsSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  remarks: z.string().optional(),
});

export type ReceiveGoodsSchema = z.infer<typeof receiveGoodsSchema>;
