import { z } from 'zod';

export const updateWarehouseSchema = z.object({
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
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateWarehouseSchema = z.infer<typeof updateWarehouseSchema>;
