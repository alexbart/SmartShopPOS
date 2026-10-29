import { z } from 'zod';

export const updateCustomerSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  taxPin: z.string().optional(),
  address: z.string().optional(),
  creditLimit: z.number().positive('Credit limit must be positive').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
