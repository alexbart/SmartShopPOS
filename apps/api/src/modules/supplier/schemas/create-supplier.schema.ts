import { z } from 'zod';

export const createSupplierSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code must not exceed 50 characters'),
  name: z.string().min(1, 'Name is required').max(150, 'Name must not exceed 150 characters'),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  taxPin: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.string().optional(),
});

export type CreateSupplierSchema = z.infer<typeof createSupplierSchema>;
