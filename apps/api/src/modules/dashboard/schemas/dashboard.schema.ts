import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  limit: z.string().optional().default('10'),
});

export type DashboardQuerySchema = z.infer<typeof dashboardQuerySchema>;
