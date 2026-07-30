import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must not exceed 150 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must not exceed 50 characters'),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
});

export type CreateBrandSchema = z.infer<typeof createBrandSchema>;
