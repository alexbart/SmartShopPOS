/**
 * Structural input types for the ESC/POS renderer.
 *
 * These deliberately mirror the app's ReceiptData / ReceiptBranding /
 * ReceiptTemplateView shapes without importing them, so the renderer stays a
 * dependency-free module that a future desktop (Electron/Tauri) build or a
 * local print agent can reuse unchanged.
 */

export type PaperWidth = 58 | 80;

export type Alignment = 'left' | 'center' | 'right';

export interface EscPosReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface EscPosReceipt {
  number: string;
  items: EscPosReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string | null;
  timestamp: string;
  cashier: string;
}

export interface EscPosBranding {
  businessName?: string | null;
  name?: string | null;
  tagline?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  kraPin?: string | null;
  vatNumber?: string | null;
  receiptFooter?: string | null;
  currency?: string | null;
}

export interface EscPosSections {
  showLogo: boolean;
  showBusinessName: boolean;
  showTagline: boolean;
  showContact: boolean;
  showTaxInfo: boolean;
  showCustomer: boolean;
  showItems: boolean;
  showSubtotal: boolean;
  showTax: boolean;
  showDiscount: boolean;
  showPaymentMethod: boolean;
  showCashier: boolean;
  showFooter: boolean;
  showPoweredBy: boolean;
}

export interface EscPosStyles {
  paperWidth: PaperWidth;
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
  alignment: Alignment;
}

export interface EscPosTemplate {
  sections?: Partial<EscPosSections> | null;
  styles?: Partial<EscPosStyles> | null;
  headerText?: string | null;
  footerText?: string | null;
}

export interface EscPosRenderOptions {
  /** Overrides the template/paper default, e.g. from the till profile. */
  paperWidth?: PaperWidth;
  /** Emit a partial cut at the end of the job. */
  cut?: boolean;
}

export interface EscPosInput {
  receipt: EscPosReceipt;
  branding?: EscPosBranding | null;
  template?: EscPosTemplate | null;
  options?: EscPosRenderOptions;
}
