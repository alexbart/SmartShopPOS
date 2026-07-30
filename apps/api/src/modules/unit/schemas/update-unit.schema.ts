import { z } from 'zod';

export const updateUnitSchema = z.object({
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
  abbreviation: z
    .string()
    .min(1, 'Abbreviation is required')
    .max(20, 'Abbreviation must not exceed 20 characters')
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUnitSchema = z.infer<typeof updateUnitSchema>;
