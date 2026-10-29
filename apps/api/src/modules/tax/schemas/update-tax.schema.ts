import { z } from 'zod';

export const updateTaxSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(150, 'Name must not exceed 150 characters')
    .optional(),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must not exceed 50 characters')
    .optional(),
  description: z.string().optional(),
  rate: z
    .number()
    .min(0, 'Rate must be at least 0')
    .max(100, 'Rate must not exceed 100')
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTaxSchema = z.infer<typeof updateTaxSchema>;
