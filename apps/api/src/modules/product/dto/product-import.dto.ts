import { z } from 'zod';

const referenceText = z.string().trim().min(1).max(150).optional().nullable();

export const productImportRowSchema = z
  .object({
    // Required fields
    name: z.string().min(1, 'Product name is required').max(150),
    code: z.string().min(1, 'Code is required').max(50),

    // Catalog references arrive either as an id (API clients) or as the human
    // name/code written in the spreadsheet. The importer resolves names against
    // the organization's own catalog, so a spreadsheet never carries uuids.
    unitId: z.string().uuid().optional().nullable(),
    unitName: referenceText,
    categoryId: z.string().uuid().optional().nullable(),
    categoryName: referenceText,
    brandId: z.string().uuid().optional().nullable(),
    brandName: referenceText,
    taxId: z.string().uuid().optional().nullable(),
    taxName: referenceText,

    // Optional fields
    sku: z.string().max(100).optional(),
    barcode: z.string().max(100).optional(),
    description: z.string().optional(),

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
  .refine((product) => Boolean(product.unitId || product.unitName), {
    message: 'Unit is required - fill in the Unit column',
    path: ['unitName'],
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

/**
 * The workbook travels as base64 JSON: the API has no multipart parser and the
 * template download endpoint already speaks xlsx bytes.
 */
export const productImportUploadSchema = z.object({
  warehouseId: z
    .string()
    .uuid({ message: 'Choose the warehouse that should receive the opening stock' }),
  fileName: z.string().trim().max(255).optional(),
  contentBase64: z.string().min(1, 'Choose a filled-in template to upload'),
});

export type ProductImportUploadInput = z.infer<typeof productImportUploadSchema>;

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
