import { z } from 'zod';

export const createCartSchema = z.object({
  warehouseId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
});

export type CreateCartSchema = z.infer<typeof createCartSchema>;

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price must be zero or positive'),
});

export type AddCartItemSchema = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  price: z.number().nonnegative('Price must be zero or positive').optional(),
});

export type UpdateCartItemSchema = z.infer<typeof updateCartItemSchema>;
