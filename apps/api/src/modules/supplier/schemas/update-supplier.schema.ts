import { z } from 'zod';

export const updateSupplierSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must not exceed 50 characters')
    .optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(150, 'Name must not exceed 150 characters')
    .optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  taxPin: z.string().optional(),
  creditLimit: z.number().min(0).optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateSupplierSchema = z.infer<typeof updateSupplierSchema>;
