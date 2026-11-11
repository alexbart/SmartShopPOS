import { z } from 'zod';

export const receiptTemplateSectionsSchema = z.object({
  showLogo: z.boolean().default(true),
  showBusinessName: z.boolean().default(true),
  showTagline: z.boolean().default(true),
  showContact: z.boolean().default(true),
  showTaxInfo: z.boolean().default(true),
  showCustomer: z.boolean().default(true),
  showItems: z.boolean().default(true),
  showSubtotal: z.boolean().default(true),
  showTax: z.boolean().default(true),
  showDiscount: z.boolean().default(true),
  showPaymentMethod: z.boolean().default(true),
  showCashier: z.boolean().default(true),
  showFooter: z.boolean().default(true),
  showPoweredBy: z.boolean().default(true),
});

export type ReceiptTemplateSections = z.infer<typeof receiptTemplateSectionsSchema>;

export const receiptTemplateStylesSchema = z.object({
  paperWidth: z.union([z.literal(58), z.literal(80)]).default(80),
  fontSize: z.number().int().min(8).max(18).default(12),
  lineHeight: z.number().min(1).max(2.5).default(1.4),
  sectionSpacing: z.number().int().min(0).max(24).default(8),
  logoWidth: z.number().int().min(20).max(80).default(42),
  logoMaxHeight: z.number().int().min(8).max(30).default(16),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
});

export type ReceiptTemplateStyles = z.infer<typeof receiptTemplateStylesSchema>;

export const createReceiptTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  isDefault: z.boolean().default(false),
  sections: receiptTemplateSectionsSchema.optional(),
  styles: receiptTemplateStylesSchema.optional(),
  headerText: z.string().max(1000).optional(),
  footerText: z.string().max(1000).optional(),
});

export type CreateReceiptTemplateInput = z.infer<typeof createReceiptTemplateSchema>;

export const updateReceiptTemplateSchema = createReceiptTemplateSchema.partial();

export type UpdateReceiptTemplateInput = z.infer<typeof updateReceiptTemplateSchema>;

export const receiptTemplateResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  isDefault: z.boolean(),
  sections: z.record(z.any()),
  styles: z.record(z.any()),
  headerText: z.string().nullable().optional(),
  footerText: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export type ReceiptTemplateResponse = z.infer<typeof receiptTemplateResponseSchema>;
