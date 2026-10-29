import { z } from 'zod';

export const updateBrandSchema = z.object({
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
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateBrandSchema = z.infer<typeof updateBrandSchema>;
