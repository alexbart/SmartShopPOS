import { z } from 'zod';

/** Largest job we accept: a dense 80mm receipt is a few KB, so this is generous. */
export const MAX_PRINT_JOB_BYTES = 64 * 1024;

export const rawPrintSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(9100),
  /** Base64-encoded ESC/POS command stream. */
  data: z.string().min(1),
});

export type RawPrintInput = z.infer<typeof rawPrintSchema>;

export interface RawPrintResult {
  bytes: number;
  host: string;
  port: number;
}
