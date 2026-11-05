<script setup lang="ts">
import { computed } from 'vue';
import type { ReceiptBranding, ReceiptData } from '@/modules/sales/composables/types';
import { Printer, Mail, Send, Download, X } from '@lucide/vue';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  receipt: ReceiptData;
  branding?: ReceiptBranding | null;
}>();

const emit = defineEmits<{
  (e: 'print'): void;
  (e: 'email'): void;
  (e: 'sms'): void;
  (e: 'download'): void;
  (e: 'done'): void;
}>();

// Every cosmetic value falls back to a sane default so a receipt can always print,
// even before the organization branding request resolves.
const businessName = computed(
  () => props.branding?.businessName?.trim() || props.branding?.name?.trim() || 'SMARTSHOP POS',
);
const tagline = computed(() => props.branding?.tagline?.trim() || '');
const logoUrl = computed(() => props.branding?.logoUrl?.trim() || '');
const currency = computed(() => props.branding?.currency?.trim() || 'KES');
const footerText = computed(() => props.branding?.receiptFooter?.trim() || '');
const contactLine = computed(() => {
  const parts = [props.branding?.phone?.trim(), props.branding?.website?.trim()].filter(Boolean);
  return parts.join(' · ');
});
const taxLine = computed(() => {
  const pin = props.branding?.kraPin?.trim();
  const vat = props.branding?.vatNumber?.trim();
  return [pin ? `PIN: ${pin}` : '', vat ? `VAT: ${vat}` : ''].filter(Boolean).join('   ');
});

// Keep currency formatting consistent throughout the receipt.
function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// The parent handles the print dialog so that printing has one entry point.
function printReceipt() {
  emit('print');
}

// The parent opens the browser print dialog.
// The user can select "Save as PDF" from the destination options.
function saveAsPdf() {
  emit('download');
}
</script>

<template>
  <Card class="receipt-shell mx-auto w-full max-w-md bg-white text-black dark:bg-white">
    <!-- This section alone should appear on the printed receipt. -->
    <CardContent class="receipt-print-area px-5 py-6">
      <header class="receipt-header text-center">
        <!-- Logo sits above the business name; it is skipped entirely when unset. -->
        <img
          v-if="logoUrl"
          :src="logoUrl"
          :alt="businessName"
          class="receipt-logo"
        />

        <h1 class="receipt-business-name">{{ businessName }}</h1>
        <p v-if="tagline" class="receipt-tagline">{{ tagline }}</p>
        <p v-if="contactLine" class="receipt-meta receipt-contact">{{ contactLine }}</p>
        <p v-if="taxLine" class="receipt-meta receipt-tax">{{ taxLine }}</p>

        <Separator class="receipt-divider my-3" />

        <h2 class="receipt-title">SALES RECEIPT</h2>
        <p class="receipt-meta">Receipt: {{ receipt.number }}</p>
        <p class="receipt-meta">{{ receipt.timestamp }}</p>
      </header>

      <section
        v-if="receipt.customerName"
        class="receipt-customer mt-4 text-sm"
      >
        <p class="receipt-label">Customer</p>
        <p class="break-words">{{ receipt.customerName }}</p>
      </section>

      <Separator class="receipt-divider my-3" />

      <section aria-label="Purchased items">
        <div class="receipt-items-heading">
          <span>ITEM</span>
          <span class="text-right">TOTAL ({{ currency }})</span>
        </div>

        <div
          v-for="(item, index) in receipt.items"
          :key="`${item.name}-${index}`"
          class="receipt-item"
        >
          <div class="receipt-item-description">
            <p class="receipt-item-name">{{ item.name }}</p>
            <p class="receipt-item-calculation">
              {{ item.quantity }} × {{ currency }} {{ formatMoney(item.price) }}
            </p>
          </div>

          <span class="receipt-item-total">
            {{ formatMoney(item.total) }}
          </span>
        </div>
      </section>

      <Separator class="receipt-divider my-3" />

      <section aria-label="Receipt totals" class="receipt-totals">
        <div class="receipt-total-row">
          <span>Subtotal</span>
          <span>{{ currency }} {{ formatMoney(receipt.subtotal) }}</span>
        </div>

        <div class="receipt-total-row">
          <span>Tax</span>
          <span>{{ currency }} {{ formatMoney(receipt.tax) }}</span>
        </div>

        <div
          v-if="receipt.discount > 0"
          class="receipt-total-row"
        >
          <span>Discount applied</span>
          <span>-{{ currency }} {{ formatMoney(receipt.discount) }}</span>
        </div>

        <p
          v-if="receipt.discount > 0"
          class="receipt-discount-note"
        >
          Discounts are already reflected in the subtotal where applicable.
        </p>

        <Separator class="receipt-divider my-2" />

        <div class="receipt-grand-total">
          <span>TOTAL</span>
          <span>{{ currency }} {{ formatMoney(receipt.total) }}</span>
        </div>
      </section>

      <Separator class="receipt-divider my-3" />

      <section class="receipt-payment text-sm">
        <div class="receipt-total-row">
          <span>Payment method</span>
          <span>{{ receipt.paymentMethod }}</span>
        </div>

        <div class="receipt-total-row">
          <span>Cashier</span>
          <span>{{ receipt.cashier }}</span>
        </div>
      </section>

      <footer class="receipt-footer mt-5 text-center">
        <p class="receipt-thank-you">Thank you for your purchase!</p>
        <p v-if="footerText" class="receipt-footer-note">{{ footerText }}</p>
        <p v-else class="receipt-footer-note">Please keep this receipt for your records.</p>
        <p class="receipt-footer-brand">Powered by SmartShop POS</p>
      </footer>
    </CardContent>

    <!-- Actions are available on screen but hidden when printing. -->
    <CardFooter class="receipt-actions flex flex-wrap justify-center gap-2 border-t pt-3">
      <Button
        size="sm"
        class="touch-target"
        @click="printReceipt"
      >
        <Printer class="mr-1 h-4 w-4" />
        Print
      </Button>

      <Button
        variant="outline"
        size="sm"
        class="touch-target"
        @click="saveAsPdf"
      >
        <Download class="mr-1 h-4 w-4" />
        Save as PDF
      </Button>

      <Button
        variant="outline"
        size="sm"
        class="touch-target"
        @click="emit('email')"
      >
        <Mail class="mr-1 h-4 w-4" />
        Email
      </Button>

      <Button
        variant="outline"
        size="sm"
        class="touch-target"
        @click="emit('sms')"
      >
        <Send class="mr-1 h-4 w-4" />
        SMS
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="touch-target"
        @click="emit('done')"
      >
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
    width: 76mm !important;
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

  :global(html),
  :global(body) {
    width: 80mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  @page {
    size: 80mm auto;
    margin: 2mm;
  }
}
</style>