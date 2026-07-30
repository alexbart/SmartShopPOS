import { z } from 'zod';

export const createUnitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must not exceed 150 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must not exceed 50 characters'),
  description: z.string().optional(),
  abbreviation: z
    .string()
    .min(1, 'Abbreviation is required')
    .max(20, 'Abbreviation must not exceed 20 characters'),
});

export type CreateUnitSchema = z.infer<typeof createUnitSchema>;
