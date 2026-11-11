export type PaperWidth = 58 | 80;

export type Alignment = 'left' | 'center' | 'right';

export interface ReceiptSectionConfig {
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

export interface ReceiptStyleConfig {
  paperWidth: PaperWidth;
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
  logoWidth: number;
  logoMaxHeight: number;
  alignment: Alignment;
}

export interface ReceiptTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  organizationId: string;
  sections: ReceiptSectionConfig;
  styles: ReceiptStyleConfig;
  headerText: string;
  footerText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptTemplateInput {
  name: string;
  isDefault?: boolean;
  sections?: Partial<ReceiptSectionConfig>;
  styles?: Partial<ReceiptStyleConfig>;
  headerText?: string;
  footerText?: string;
}

// What the renderer actually needs. Lets the designer preview unsaved edits
// without fabricating a persisted ReceiptTemplate.
export interface ReceiptTemplateView {
  sections?: Partial<ReceiptSectionConfig> | null;
  styles?: Partial<ReceiptStyleConfig> | null;
  headerText?: string | null;
  footerText?: string | null;
}

export const DEFAULT_SECTIONS: ReceiptSectionConfig = {
  showLogo: true,
  showBusinessName: true,
  showTagline: true,
  showContact: true,
  showTaxInfo: true,
  showCustomer: true,
  showItems: true,
  showSubtotal: true,
  showTax: true,
  showDiscount: true,
  showPaymentMethod: true,
  showCashier: true,
  showFooter: true,
  showPoweredBy: true,
};

export const DEFAULT_STYLES: ReceiptStyleConfig = {
  paperWidth: 80,
  fontSize: 12,
  lineHeight: 1.4,
  sectionSpacing: 8,
  logoWidth: 42,
  logoMaxHeight: 16,
  alignment: 'center',
};

export const EMPTY_TEMPLATE: Omit<
  ReceiptTemplate,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt'
> = {
  name: 'New Template',
  isDefault: false,
  sections: { ...DEFAULT_SECTIONS },
  styles: { ...DEFAULT_STYLES },
  headerText: '',
  footerText: '',
};

export function getPaperWidthClass(paperWidth: PaperWidth): string {
  return paperWidth === 58 ? 'max-w-[58mm]' : 'max-w-[80mm]';
}

export function getPaperWidthPrint(paperWidth: PaperWidth): string {
  return `${paperWidth}mm`;
}
