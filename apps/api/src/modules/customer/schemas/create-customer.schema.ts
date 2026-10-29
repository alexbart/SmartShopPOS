import { z } from 'zod';

export const createCustomerSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code must not exceed 50 characters'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  taxPin: z.string().optional(),
  address: z.string().optional(),
  creditLimit: z.number().positive('Credit limit must be positive').optional(),
});

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
