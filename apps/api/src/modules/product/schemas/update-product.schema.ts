import { z } from 'zod';

export const updateProductSchema = z
  .object({
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
    sku: z.string().max(100).optional(),
    barcode: z.string().max(100).optional(),
    categoryId: z.string().uuid().optional().nullable(),
    brandId: z.string().uuid().optional().nullable(),
    unitId: z.string().uuid().optional(),
    taxId: z.string().uuid().optional().nullable(),
    costPrice: z.number().min(0, 'Cost price must be at least 0').optional(),
    sellingPrice: z.number().min(0, 'Selling price must be at least 0').optional(),
    wholesalePrice: z.number().min(0).optional().nullable(),
    discountPrice: z.number().min(0).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (product) =>
      product.discountPrice == null ||
      product.sellingPrice === undefined ||
      product.discountPrice <= product.sellingPrice,
    { message: 'Discount price cannot exceed retail selling price', path: ['discountPrice'] },
  );

export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
