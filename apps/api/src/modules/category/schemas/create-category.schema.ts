import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must not exceed 150 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must not exceed 50 characters'),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
    .optional(),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
