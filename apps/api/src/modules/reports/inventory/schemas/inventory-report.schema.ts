import { z } from 'zod';

export const stockReportQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  search: z.string().optional(),
  activeOnly: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

export type StockReportQuerySchema = z.infer<typeof stockReportQuerySchema>;

export const stockMovementQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  movementType: z
    .enum([
      'PURCHASE',
      'SALE',
      'RETURN',
      'TRANSFER_IN',
      'TRANSFER_OUT',
      'ADJUSTMENT',
      'DAMAGE',
      'EXPIRED',
    ])
    .optional(),
  performedBy: z.string().uuid().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

export type StockMovementQuerySchema = z.infer<typeof stockMovementQuerySchema>;

export const lowStockQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

export type LowStockQuerySchema = z.infer<typeof lowStockQuerySchema>;

export const outOfStockQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

export type OutOfStockQuerySchema = z.infer<typeof outOfStockQuerySchema>;
