import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must not exceed 150 characters'),
  code: z.string().min(1, 'Code is required').max(50, 'Code must not exceed 50 characters'),
  description: z.string().optional(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  unitId: z.string().uuid({ message: 'Unit is required' }),
  taxId: z.string().uuid().optional(),
  costPrice: z.number().min(0, 'Cost price must be at least 0'),
  sellingPrice: z.number().min(0, 'Selling price must be at least 0'),
});

export type CreateProductSchema = z.infer<typeof createProductSchema>;
