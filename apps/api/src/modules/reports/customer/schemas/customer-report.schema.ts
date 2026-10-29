import { z } from 'zod';

export const customerSummaryQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

export type CustomerSummaryQuerySchema = z.infer<typeof customerSummaryQuerySchema>;

export const customerPurchasesQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  branchId: z.string().uuid().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

export type CustomerPurchasesQuerySchema = z.infer<typeof customerPurchasesQuerySchema>;

export const topCustomersQuerySchema = z.object({
  limit: z.string().optional().default('20'),
});

export type TopCustomersQuerySchema = z.infer<typeof topCustomersQuerySchema>;
