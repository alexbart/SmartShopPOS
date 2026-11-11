/**
 * Renders a receipt to ESC/POS bytes.
 *
 * This mirrors ReceiptPreview.vue section-for-section so the thermal output and
 * the on-screen preview stay recognisable to each other. It is pure: no DOM,
 * no network, no framework — easy to test and reusable from a desktop shell.
 */

import {
  align,
  bold,
  cutPaper,
  defaultLineSpacing,
  feed,
  fontA,
  fontB,
  init,
  lineSpacing,
  LF,
  selectCodeTable437,
  textSize,
  type AlignMode,
} from './commands';
import { encodeText } from './encode';
import { center, divider, formatMoney, money, twoColumn, wrapText } from './layout';
import type { EscPosInput, EscPosSections, EscPosStyles, PaperWidth } from '../types';

const DEFAULT_SECTIONS: EscPosSections = {
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

const DEFAULT_STYLES: EscPosStyles = {
  paperWidth: 80,
  fontSize: 12,
  lineHeight: 1.4,
  sectionSpacing: 8,
  alignment: 'center',
};

/**
 * Character cells per line for the printable width:
 * 576 dots (80mm) and 384 dots (58mm) at 12 dots/char (Font A) or 9 (Font B).
 */
function columnsFor(paperWidth: PaperWidth, smallFont: boolean): number {
  if (paperWidth === 58) return smallFont ? 42 : 32;
  return smallFont ? 64 : 48;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function renderReceiptEscPos(input: EscPosInput): Uint8Array {
  const { receipt, branding, template } = input;

  const sections: EscPosSections = { ...DEFAULT_SECTIONS, ...(template?.sections ?? {}) };
  const styles: EscPosStyles = { ...DEFAULT_STYLES, ...(template?.styles ?? {}) };
  const paperWidth = input.options?.paperWidth ?? styles.paperWidth;
  const smallFont = styles.fontSize <= 10;
  const columns = columnsFor(paperWidth, smallFont);
  const alignMode: AlignMode = styles.alignment;

  const currency = branding?.currency?.trim() || 'KES';
  const businessName = branding?.businessName?.trim() || branding?.name?.trim() || 'SMARTSHOP POS';
  const tagline = branding?.tagline?.trim() || '';
  const contact = [branding?.phone?.trim(), branding?.website?.trim()].filter(Boolean).join(' - ');
  const taxLine = [
    branding?.kraPin?.trim() ? `PIN: ${branding.kraPin.trim()}` : '',
    branding?.vatNumber?.trim() ? `VAT: ${branding.vatNumber.trim()}` : '',
  ]
    .filter(Boolean)
    .join('   ');

  const headerText = template?.headerText?.trim() || '';
  const footerText = template?.footerText?.trim() || branding?.receiptFooter?.trim() || '';
  const gap = Math.min(2, Math.max(0, Math.round(styles.sectionSpacing / 4)));

  const out: number[] = [];
  const push = (bytes: number[]) => out.push(...bytes);
  const blank = (count = 1) => {
    for (let i = 0; i < count; i += 1) push([LF]);
  };
  /** Writes wrapped lines at the current alignment. */
  const text = (value: string, mode: AlignMode = alignMode) => {
    if (!value.trim()) return;
    push(align(mode));
    for (const line of wrapText(value, columns)) {
      push(encodeText(line));
      push([LF]);
    }
  };
  const row = (left: string, right: string) => {
    push(align('left'));
    for (const line of twoColumn(left, right, columns)) {
      push(encodeText(line));
      push([LF]);
    }
  };
  const rule = () => {
    push(align('left'));
    push(encodeText(divider(columns)));
    push([LF]);
  };
  const centered = (value: string) => {
    push(align('left'));
    push(encodeText(center(value, columns)));
    push([LF]);
  };

  // --- Printer setup -------------------------------------------------------
  push(init());
  push(selectCodeTable437());
  push(smallFont ? fontB() : fontA());

  // The designer's line height maps onto the printer's dot line spacing; the
  // floor keeps glyphs from overlapping on narrow paper.
  const baseDots = smallFont ? 17 : 24;
  const dots = Math.max(smallFont ? 20 : 24, Math.round(baseDots * styles.lineHeight));
  push(lineSpacing(dots));
  push(align(alignMode));
  push(textSize(1, 1));

  // --- Header --------------------------------------------------------------
  if (sections.showBusinessName) {
    push(bold(true));
    push(textSize(1, 2));
    text(businessName);
    push(textSize(1, 1));
    push(bold(false));
  }

  if (sections.showTagline && tagline) text(tagline);

  if (sections.showContact && contact) text(contact);

  if (sections.showTaxInfo && taxLine) text(taxLine);

  if (headerText) text(headerText);

  blank();
  rule();
  blank();

  // --- Receipt identity ----------------------------------------------------
  push(bold(true));
  text('SALES RECEIPT');
  push(bold(false));
  text(`No: ${receipt.number}`);
  text(formatTimestamp(receipt.timestamp));

  if (sections.showCustomer && receipt.customerName?.trim()) {
    text(`Customer: ${receipt.customerName.trim()}`);
  }

  blank();
  rule();
  blank();

  // --- Line items ----------------------------------------------------------
  if (sections.showItems) {
    push(bold(true));
    row('ITEM', `AMOUNT (${currency})`);
    push(bold(false));

    for (const item of receipt.items) {
      const label = item.quantity > 1 ? `${item.quantity} x ${item.name}` : item.name;
      // Amounts stay bare under the AMOUNT (KES) heading to save roll width.
      row(label, formatMoney(item.total));
    }

    blank();
    rule();
  }

  // --- Totals --------------------------------------------------------------
  if (sections.showSubtotal) row('Subtotal', money(receipt.subtotal, currency));

  if (sections.showTax) row('Tax', money(receipt.tax, currency));

  if (sections.showDiscount && receipt.discount > 0) {
    row('Discount applied', `-${money(receipt.discount, currency)}`);
  }

  blank();
  push(bold(true));
  push(textSize(1, 2));
  row('TOTAL', money(receipt.total, currency));
  push(textSize(1, 1));
  push(bold(false));

  // --- Payment -------------------------------------------------------------
  if (sections.showPaymentMethod || sections.showCashier) {
    blank();
    rule();
    blank();

    if (sections.showPaymentMethod) row('Payment', receipt.paymentMethod);
    if (sections.showCashier) row('Cashier', receipt.cashier);
  }

  // --- Footer --------------------------------------------------------------
  if (sections.showFooter) {
    blank();
    text(footerText || 'Thank you for your purchase!');
  }

  if (sections.showPoweredBy) {
    blank();
    push(align('center'));
    push(encodeText(center('Powered by SmartShopPOS', columns)));
    push([LF]);
  }

  // --- Job end -------------------------------------------------------------
  push(align('left'));
  push(defaultLineSpacing());
  push(feed(gap + 2));

  if (input.options?.cut ?? true) push(cutPaper());

  return Uint8Array.from(out);
}

/** Convenience for transports that need a base64 payload. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}
