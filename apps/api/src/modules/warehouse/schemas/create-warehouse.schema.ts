import { z } from 'zod';

export const createWarehouseSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code must not exceed 50 characters'),
  name: z.string().min(1, 'Name is required').max(150, 'Name must not exceed 150 characters'),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type CreateWarehouseSchema = z.infer<typeof createWarehouseSchema>;
