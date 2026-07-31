import { z } from 'zod';

export const createSaleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price must be zero or positive'),
  discount: z.number().nonnegative('Discount must be zero or positive').optional(),
  tax: z.number().nonnegative('Tax must be zero or positive').optional(),
});

export const createSaleSchema = z.object({
  warehouseId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  items: z.array(createSaleItemSchema).min(1, 'At least one item is required'),
  discount: z.number().nonnegative('Discount must be zero or positive').optional(),
  tax: z.number().nonnegative('Tax must be zero or positive').optional(),
});

export type CreateSaleSchema = z.infer<typeof createSaleSchema>;
