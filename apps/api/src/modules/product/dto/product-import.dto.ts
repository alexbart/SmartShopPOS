import { z } from 'zod';

export const productImportRowSchema = z
  .object({
    // Required fields
    name: z.string().min(1, 'Product name is required').max(150),
    code: z.string().min(1, 'Code is required').max(50),
    unitId: z.string().uuid({ message: 'Unit is required' }),

    // Optional fields
    sku: z.string().max(100).optional(),
    barcode: z.string().max(100).optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    brandId: z.string().uuid().optional().nullable(),
    taxId: z.string().uuid().optional().nullable(),

    // Pricing
    costPrice: z.number().min(0, 'Cost price must be >= 0'),
    sellingPrice: z.number().min(0, 'Selling price must be >= 0'),
    wholesalePrice: z.number().min(0).optional().nullable(),
    discountPrice: z.number().min(0).optional().nullable(),

    // Inventory
    lowStockThreshold: z.number().int().min(0).optional(),
    initialStock: z.number().int().min(0).optional(),

    // Status
    isActive: z.boolean().default(true),
  })
  .refine(
    (product) => product.discountPrice == null || product.discountPrice <= product.sellingPrice,
    { message: 'Discount price cannot exceed retail selling price', path: ['discountPrice'] },
  )
  .refine(
    (product) => product.wholesalePrice == null || product.wholesalePrice <= product.sellingPrice,
    { message: 'Wholesale price cannot exceed retail selling price', path: ['wholesalePrice'] },
  )
  .refine(
    (product) => product.wholesalePrice == null || product.wholesalePrice >= product.costPrice,
    { message: 'Wholesale price cannot be less than cost price', path: ['wholesalePrice'] },
  );

export type ProductImportRowInput = z.infer<typeof productImportRowSchema>;

export const productImportJobSchema = z.object({
  warehouseId: z.string().uuid({ message: 'Warehouse ID is required' }),
  sourceName: z.string().optional(),
});

export type ProductImportJobInput = z.infer<typeof productImportJobSchema>;

export const productImportStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'PARTIAL',
]);

export type ProductImportStatus = z.infer<typeof productImportStatusSchema>;

export interface ProductImportRowResult {
  rowNumber: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  productId?: string;
  error?: string;
  data?: {
    name: string;
    code: string;
    sku?: string;
    barcode?: string;
  };
}

export interface ProductImportJobResult {
  jobId: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  results: ProductImportRowResult[];
  status: ProductImportStatus;
}

export interface ProductImportJobStatus {
  jobId: string;
  status: ProductImportStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  currentRow?: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}
