<script setup lang="ts">
import { computed } from 'vue';
import type { ReceiptData } from '@/modules/sales/composables/types';
import type { ReceiptBranding } from '@/modules/sales/composables/types';
import type { ReceiptTemplateView } from '@/modules/sales/composables/receipt-template';
import { Printer, Mail, Send, Download, X } from '@lucide/vue';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Props {
  receipt: ReceiptData;
  branding?: ReceiptBranding | null;
  template?: ReceiptTemplateView | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'print'): void;
  (e: 'email'): void;
  (e: 'sms'): void;
  (e: 'download'): void;
  (e: 'done'): void;
}>();

// Merge template with defaults
const sections = computed(() => ({
  showLogo: props.template?.sections?.showLogo ?? true,
  showBusinessName: props.template?.sections?.showBusinessName ?? true,
  showTagline: props.template?.sections?.showTagline ?? true,
  showContact: props.template?.sections?.showContact ?? true,
  showTaxInfo: props.template?.sections?.showTaxInfo ?? true,
  showCustomer: props.template?.sections?.showCustomer ?? true,
  showItems: props.template?.sections?.showItems ?? true,
  showSubtotal: props.template?.sections?.showSubtotal ?? true,
  showTax: props.template?.sections?.showTax ?? true,
  showDiscount: props.template?.sections?.showDiscount ?? true,
  showPaymentMethod: props.template?.sections?.showPaymentMethod ?? true,
  showCashier: props.template?.sections?.showCashier ?? true,
  showFooter: props.template?.sections?.showFooter ?? true,
  showPoweredBy: props.template?.sections?.showPoweredBy ?? true,
}));

const styles = computed(() => ({
  paperWidth: props.template?.styles?.paperWidth ?? 80,
  fontSize: props.template?.styles?.fontSize ?? 12,
  lineHeight: props.template?.styles?.lineHeight ?? 1.4,
  sectionSpacing: props.template?.styles?.sectionSpacing ?? 8,
  logoWidth: props.template?.styles?.logoWidth ?? 42,
  logoMaxHeight: props.template?.styles?.logoMaxHeight ?? 16,
  alignment: props.template?.styles?.alignment ?? 'center',
}));

const headerText = computed(() => props.template?.headerText?.trim() || '');
// A template footer wins, then the organization's own footer, then the built-in line.
const footerText = computed(
  () => props.template?.footerText?.trim() || props.branding?.receiptFooter?.trim() || '',
);

const businessName = computed(
  () => props.branding?.businessName?.trim() || props.branding?.name?.trim() || 'SMARTSHOP POS',
);
const tagline = computed(() => props.branding?.tagline?.trim() || '');
const logoUrl = computed(() => props.branding?.logoUrl?.trim() || '');
const currency = computed(() => props.branding?.currency?.trim() || 'KES');
const contactLine = computed(() => {
  const parts = [props.branding?.phone?.trim(), props.branding?.website?.trim()].filter(Boolean);
  return parts.join(' · ');
});
const taxLine = computed(() => {
  const pin = props.branding?.kraPin?.trim();
  const vat = props.branding?.vatNumber?.trim();
  return [pin ? `PIN: ${pin}` : '', vat ? `VAT: ${vat}` : ''].filter(Boolean).join('   ');
});

const alignmentClass = computed(() => {
  const align = styles.value.alignment;
  return align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
});

const sectionSpacingStyle = computed(() => ({
  marginBottom: `${styles.value.sectionSpacing}px`,
}));

// Format money utility
function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Print/save actions
function printReceipt() {
  emit('print');
}

function saveAsPdf() {
  emit('download');
}

// Get paper width class for screen display
function getPaperWidthClass(paperWidth: number): string {
  return paperWidth === 58 ? 'max-w-[58mm]' : 'max-w-[80mm]';
}

// Applied globally so the roll width drives both the page box and the body width.
const printPageRule = computed(
  () => `@page { size: ${styles.value.paperWidth}mm auto; margin: 2mm; }
@media print { html, body { width: ${styles.value.paperWidth}mm !important; margin: 0 !important; padding: 0 !important; background: #fff !important; } }`,
);
</script>

<template>
  <!-- Page box follows the selected roll width, so 58mm templates stop wasting tape. -->
  <component :is="'style'">{{ printPageRule }}</component>

  <Card
    class="receipt-shell mx-auto w-full bg-white text-black dark:bg-white"
    :class="getPaperWidthClass(styles.paperWidth)"
    :style="{ '--receipt-print-width': `${styles.paperWidth}mm` }"
  >
    <!-- This section alone should appear on the printed receipt. -->
    <CardContent
      class="receipt-print-area"
      :style="{ padding: `${styles.sectionSpacing}px ${styles.sectionSpacing * 2}px` }"
    >
      <header
        class="receipt-header"
        :class="alignmentClass"
        :style="{ lineHeight: `${styles.lineHeight}` }"
      >
        <!-- Logo sits above the business name; it is skipped entirely when unset. -->
        <img
          v-if="sections.showLogo && logoUrl"
          :src="logoUrl"
          :alt="businessName"
          class="receipt-logo"
          :style="{ maxWidth: `${styles.logoWidth}%`, maxHeight: `${styles.logoMaxHeight}mm` }"
        />

        <h1
          v-if="sections.showBusinessName"
          class="receipt-business-name"
          :style="{ fontSize: `${styles.fontSize * 1.125}px` }"
        >
          {{ businessName }}
        </h1>

        <p
          v-if="sections.showTagline && tagline"
          class="receipt-tagline"
          :style="{ fontSize: `${styles.fontSize * 0.6}px` }"
        >
          {{ tagline }}
        </p>

        <p
          v-if="sections.showContact && contactLine"
          class="receipt-meta receipt-contact"
          :style="{ fontSize: `${styles.fontSize * 0.6}px` }"
        >
          {{ contactLine }}
        </p>

        <p
          v-if="sections.showTaxInfo && taxLine"
          class="receipt-meta receipt-tax"
          :style="{ fontSize: `${styles.fontSize * 0.6}px` }"
        >
          {{ taxLine }}
        </p>

        <p
          v-if="headerText"
          class="receipt-meta"
          :style="{ fontSize: `${styles.fontSize * 0.6}px`, fontStyle: 'italic' }"
        >
          {{ headerText }}
        </p>

        <Separator
          v-if="
            sections.showBusinessName ||
            sections.showTagline ||
            sections.showContact ||
            sections.showTaxInfo ||
            headerText
          "
          class="receipt-divider"
          :style="sectionSpacingStyle"
        />

        <h2 class="receipt-title" :style="{ fontSize: `${styles.fontSize * 0.8}px` }">
          SALES RECEIPT
        </h2>
        <p class="receipt-meta" :style="{ fontSize: `${styles.fontSize * 0.6}px` }">
          Receipt: {{ receipt.number }}
        </p>
        <p class="receipt-meta" :style="{ fontSize: `${styles.fontSize * 0.6}px` }">
          {{ receipt.timestamp }}
        </p>
      </header>

      <section
        v-if="sections.showCustomer && receipt.customerName"
        class="receipt-customer"
        :style="{
          marginTop: `${styles.sectionSpacing}px`,
          fontSize: `${styles.fontSize * 0.85}px`,
        }"
      >
        <p class="receipt-label">Customer</p>
        <p class="break-words">{{ receipt.customerName }}</p>
      </section>

      <Separator
        v-if="sections.showCustomer && receipt.customerName"
        class="receipt-divider"
        :style="sectionSpacingStyle"
      />

      <section
        v-if="sections.showItems"
        aria-label="Purchased items"
        :style="{ marginTop: `${styles.sectionSpacing}px` }"
      >
        <div class="receipt-items-heading" :style="{ fontSize: `${styles.fontSize * 0.7}px` }">
          <span>ITEM</span>
          <span class="text-right">TOTAL ({{ currency }})</span>
        </div>

        <div
          v-for="(item, index) in receipt.items"
          :key="`${item.name}-${index}`"
          class="receipt-item"
          :style="{
            fontSize: `${styles.fontSize * 0.7}px`,
            marginBottom: `${styles.sectionSpacing}px`,
          }"
        >
          <div class="receipt-item-description">
            <p class="receipt-item-name">{{ item.name }}</p>
            <p
              class="receipt-item-calculation"
              :style="{ fontSize: `${styles.fontSize * 0.55}px` }"
            >
              {{ item.quantity }} × {{ currency }} {{ formatMoney(item.price) }}
            </p>
          </div>

          <span class="receipt-item-total" :style="{ fontSize: `${styles.fontSize * 0.7}px` }">
            {{ formatMoney(item.total) }}
          </span>
        </div>
      </section>

      <Separator v-if="sections.showItems" class="receipt-divider" :style="sectionSpacingStyle" />

      <section
        v-if="
          sections.showSubtotal ||
          sections.showTax ||
          sections.showDiscount ||
          sections.showPaymentMethod
        "
        aria-label="Receipt totals"
        class="receipt-totals"
        :style="{ marginTop: `${styles.sectionSpacing}px` }"
      >
        <div
          v-if="sections.showSubtotal"
          class="receipt-total-row"
          :style="{ fontSize: `${styles.fontSize * 0.8}px` }"
        >
          <span>Subtotal</span>
          <span>{{ currency }} {{ formatMoney(receipt.subtotal) }}</span>
        </div>

        <div
          v-if="sections.showTax"
          class="receipt-total-row"
          :style="{ fontSize: `${styles.fontSize * 0.8}px` }"
        >
          <span>Tax</span>
          <span>{{ currency }} {{ formatMoney(receipt.tax) }}</span>
        </div>

        <div
          v-if="sections.showDiscount && receipt.discount > 0"
          class="receipt-total-row"
          :style="{ fontSize: `${styles.fontSize * 0.8}px` }"
        >
          <span>Discount applied</span>
          <span>-{{ currency }} {{ formatMoney(receipt.discount) }}</span>
        </div>

        <Separator
          v-if="sections.showSubtotal || sections.showTax || sections.showDiscount"
          class="receipt-divider"
          :style="sectionSpacingStyle"
        />

        <div class="receipt-grand-total" :style="{ fontSize: `${styles.fontSize * 1}px` }">
          <span>TOTAL</span>
          <span>{{ currency }} {{ formatMoney(receipt.total) }}</span>
        </div>
      </section>

      <Separator
        v-if="sections.showPaymentMethod || sections.showCashier"
        class="receipt-divider"
        :style="sectionSpacingStyle"
      />

      <section
        v-if="sections.showPaymentMethod || sections.showCashier"
        class="receipt-payment"
        :style="{ fontSize: `${styles.fontSize * 0.8}px` }"
      >
        <div v-if="sections.showPaymentMethod" class="receipt-total-row">
          <span>Payment method</span>
          <span>{{ receipt.paymentMethod }}</span>
        </div>

        <div v-if="sections.showCashier" class="receipt-total-row">
          <span>Cashier</span>
          <span>{{ receipt.cashier }}</span>
        </div>
      </section>

      <footer
        v-if="sections.showFooter"
        class="receipt-footer mt-5"
        :class="alignmentClass"
        :style="{ fontSize: `${styles.fontSize * 0.7}px`, lineHeight: `${styles.lineHeight}` }"
      >
        <p v-if="footerText" class="receipt-footer-note">{{ footerText }}</p>
        <p v-else class="receipt-thank-you">Thank you for your purchase!</p>
        <p class="receipt-footer-note">Please keep this receipt for your records.</p>
        <p v-if="sections.showPoweredBy" class="receipt-footer-brand">Powered by SmartShop POS</p>
      </footer>
    </CardContent>

    <!-- Actions are available on screen but hidden when printing. -->
    <CardFooter class="receipt-actions flex flex-wrap justify-center gap-2 border-t pt-3">
      <Button size="sm" class="touch-target" @click="printReceipt">
        <Printer class="mr-1 h-4 w-4" />
        Print
      </Button>

      <Button variant="outline" size="sm" class="touch-target" @click="saveAsPdf">
        <Download class="mr-1 h-4 w-4" />
        Save as PDF
      </Button>

      <Button variant="outline" size="sm" class="touch-target" @click="emit('email')">
        <Mail class="mr-1 h-4 w-4" />
        Email
      </Button>

      <Button variant="outline" size="sm" class="touch-target" @click="emit('sms')">
        <Send class="mr-1 h-4 w-4" />
        SMS
      </Button>

      <Button variant="ghost" size="sm" class="touch-target" @click="emit('done')">
        <X class="mr-1 h-4 w-4" />
        Done
      </Button>
    </CardFooter>
  </Card>
</template>

<style scoped>
.receipt-shell {
  font-family: Arial, Helvetica, sans-serif;
  border: 1px solid #e5e7eb;
}

.receipt-header {
  overflow-wrap: anywhere;
}

/* Kept inside ~16mm so the header still fits a 58mm/80mm thermal roll. */
.receipt-logo {
  display: block;
  max-width: 42%;
  max-height: 16mm;
  margin: 0 auto 0.4rem;
  object-fit: contain;
}

.receipt-contact,
.receipt-tax {
  margin-top: 0.15rem;
}

.receipt-business-name {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.receipt-tagline {
  margin-top: 0.25rem;
  font-size: 0.7rem;
}

.receipt-title {
  margin-bottom: 0.4rem;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.receipt-meta {
  font-size: 0.72rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.receipt-label {
  margin-bottom: 0.2rem;
  font-weight: 700;
}

.receipt-divider {
  border-color: #9ca3af;
}

.receipt-items-heading,
.receipt-item,
.receipt-total-row,
.receipt-grand-total {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.receipt-items-heading {
  margin-bottom: 0.6rem;
  font-size: 0.68rem;
  font-weight: 800;
}

.receipt-item {
  align-items: flex-start;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
}

.receipt-item-description {
  min-width: 0;
  flex: 1;
}

.receipt-item-name {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.receipt-item-calculation {
  margin-top: 0.15rem;
  color: #4b5563;
  font-size: 0.68rem;
}

.receipt-item-total {
  flex-shrink: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.receipt-totals,
.receipt-payment {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.receipt-total-row {
  align-items: flex-start;
  font-size: 0.78rem;
}

.receipt-total-row > :last-child {
  text-align: right;
  overflow-wrap: anywhere;
}

.receipt-discount-note {
  color: #4b5563;
  font-size: 0.65rem;
  line-height: 1.4;
}

.receipt-grand-total {
  align-items: baseline;
  font-size: 1rem;
  font-weight: 800;
}

.receipt-grand-total > :last-child {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.receipt-thank-you {
  font-size: 0.85rem;
  font-weight: 700;
}

.receipt-footer-note,
.receipt-footer-brand {
  margin-top: 0.3rem;
  font-size: 0.65rem;
}

.receipt-footer-brand {
  margin-top: 0.7rem;
  font-weight: 700;
}

@media print {
  /* Hide the POS workspace, modal controls and every other page element. */
  :global(body *) {
    visibility: hidden !important;
  }

  /* Restore visibility only for this receipt and its contents. */
  .receipt-print-area,
  .receipt-print-area * {
    visibility: visible !important;
  }

  .receipt-shell {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: var(--receipt-print-width, 80mm) !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #000 !important;
  }

  .receipt-print-area {
    display: block !important;
    width: 100% !important;
    padding: 2mm !important;
    background: #fff !important;
    color: #000 !important;
  }

  .receipt-actions {
    display: none !important;
  }

  .receipt-divider {
    border-color: #777 !important;
  }

  .receipt-item-calculation,
  .receipt-discount-note {
    color: #333 !important;
  }
}
</style>
