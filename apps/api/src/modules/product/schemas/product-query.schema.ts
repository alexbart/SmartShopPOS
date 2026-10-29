import { z } from 'zod';

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ProductQuerySchema = z.infer<typeof productQuerySchema>;
