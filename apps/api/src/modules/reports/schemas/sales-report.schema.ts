import { z } from 'zod';

export const salesReportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  branchId: z.string().uuid().optional(),
  cashierId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  paymentMethod: z.enum(['CASH', 'MPESA', 'CARD', 'BANK', 'CREDIT']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'VOIDED', 'REFUNDED']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

export type SalesReportQuerySchema = z.infer<typeof salesReportQuerySchema>;
