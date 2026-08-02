<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { useCart } from '@/modules/sales/composables/useCart';
import { useSale } from '@/modules/sales/composables/useSale';
import { useShiftStore } from '@/modules/shift/stores/shiftStore';
import { useNetworkStatus } from '@/modules/shift/composables/useNetworkStatus';
import type { Product, Category } from '@/shared/types';
import type { PosSale, ReceiptData } from '@/modules/sales/composables/types';
import SearchBar from '@/modules/sales/components/SearchBar.vue';
import ProductGrid from '@/modules/sales/components/ProductGrid.vue';
import ProductShortcuts from '@/modules/sales/components/ProductShortcuts.vue';
import CartSummary from '@/modules/sales/components/CartSummary.vue';
import CustomerLookup from '@/modules/sales/components/CustomerLookup.vue';
import PaymentDrawer from '@/modules/sales/components/PaymentDrawer.vue';
import ReceiptPreview from '@/modules/sales/components/ReceiptPreview.vue';
import QuickActions from '@/modules/sales/components/QuickActions.vue';
import RecentSales from '@/modules/sales/components/RecentSales.vue';
import SuspendSaleDialog from '@/modules/sales/components/SuspendSaleDialog.vue';
import { Button } from '@/components/ui/button';
import {
  Wifi, WifiOff, Clock, Grid3X3, LayoutList,
  Zap, History, X,
} from '@lucide/vue';

// Live Nairobi clock
const now = ref(new Date());
let clockTimer: ReturnType<typeof setInterval>;
const localTime = computed(() =>
  now.value.toLocaleTimeString('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }),
);

const queryClient = useQueryClient();
const auth = useAuthStore();
const shiftStore = useShiftStore();
const { isOnline } = useNetworkStatus();
const {
  items, addItem, removeItem, updateQuantity, setDiscount, setNote,
  clearCart, setCustomer, clearCustomer, setPaymentMethod, setTax,
  selectedPaymentMethod, customerId, customerName,
  selectedTaxId, taxes,
  subtotal, tax, totalDiscount, total, itemCount, isEmpty, toReceiptData,
} = useCart();

const { isProcessing, processSale, suspendSale, getSuspendedSales } = useSale();

const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const paymentDrawerOpen = ref(false);
const showReceipt = ref(false);
const receiptData = ref<ReceiptData | null>(null);
const suspendDialogOpen = ref(false);
const showCartRecovery = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');

// Toggle panels — both closed by default so full workspace is available
const showQuickActions = ref(false);
const showRecentSales = ref(false);

const { data: productsData, isLoading: productsLoading } = useQuery({
  queryKey: ['pos-products'],
  queryFn: async () => {
    const response = await apiClient.get('/products', { params: { page: '1', limit: '100' } });
    return response.data.data.items as Product[];
  },
  staleTime: 60_000,
});

const products = computed(() => (productsData.value ?? []) as Product[]);

const { data: categoriesData } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const response = await apiClient.get('/categories');
    return response.data.data.items as Category[];
  },
  staleTime: 60_000,
});

const pinnedProductIds = ref<string[]>(
  JSON.parse(localStorage.getItem('pos-pinned-products') || '[]'),
);

const displayedCategories = computed(() => [
  { id: null as string | null, name: 'All' },
  ...(categoriesData.value ?? []).slice(0, 5),
]);

const filteredProducts = computed(() => {
  let result = products.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.brandName || '').toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q),
    );
  }
  if (selectedCategory.value) {
    result = result.filter((p) => p.categoryId === selectedCategory.value);
  }
  return result;
});

function togglePin(productId: string) {
  if (pinnedProductIds.value.includes(productId)) {
    pinnedProductIds.value = pinnedProductIds.value.filter((id) => id !== productId);
  } else {
    pinnedProductIds.value = [...pinnedProductIds.value, productId];
  }
  localStorage.setItem('pos-pinned-products', JSON.stringify(pinnedProductIds.value));
}

function handleProductSelect(product: Product) {
  if (!shiftStore.isShiftOpen) {
    notification.warning('Open shift first', 'Please open a cash drawer before selling.');
    return;
  }
  if ((product.stockQuantity ?? 0) <= 0) {
    notification.warning('Out of stock', `${product.name} has no stock available.`);
    return;
  }
  addItem(product);
  searchQuery.value = '';
  notification.success('Added', product.name);
}

function handleShortcutSelect(product: Product) {
  addItem(product);
  notification.success('Added', product.name);
}

function handleBarcode(barcode: string) {
  const product = products.value.find(
    (p) => p.barcode === barcode || p.code === barcode || p.sku === barcode,
  );
  if (product) {
    addItem(product);
    notification.success('Scanned', product.name);
  } else {
    notification.warning('Barcode not found', barcode);
  }
}

function handleCheckout() {
  if (isEmpty.value) {
    notification.warning('Empty cart', 'Add products before completing sale.');
    return;
  }
  paymentDrawerOpen.value = true;
}

function handlePayment(payload: { method: any; tendered?: number; change?: number; split?: any[] }) {
  paymentDrawerOpen.value = false;
  const sale: PosSale = {
    cartItems: items.value,
    subtotal: subtotal.value,
    tax: tax.value,
    discount: totalDiscount.value,
    total: total.value,
    paymentMethod: payload.method,
    tenderedAmount: payload.tendered,
    change: payload.change,
    splitPayments: payload.split,
    customerId: customerId.value ?? undefined,
    customerName: customerName.value ?? undefined,
  };
  (async () => {
    const result = await processSale(sale);
    if (result?.success) {
      receiptData.value = toReceiptData(auth.user?.firstName || 'Cashier');
      showReceipt.value = true;
      clearCart();
      setPaymentMethod('CASH');
      clearCustomer();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  })();
}

function handleSuspend() {
  const sale: PosSale = {
    cartItems: items.value,
    subtotal: subtotal.value,
    tax: tax.value,
    discount: totalDiscount.value,
    total: total.value,
    paymentMethod: selectedPaymentMethod.value,
    customerId: customerId.value ?? undefined,
    customerName: customerName.value ?? undefined,
  };
  suspendSale(sale);
}

function handleResume(sale: PosSale) {
  suspendDialogOpen.value = false;
  notification.success('Sale resumed', `KES ${sale.total?.toLocaleString()}`);
}

function handleDeleteSuspended(sale: PosSale) {
  const saved = localStorage.getItem('pos-suspended-sales');
  const sales: PosSale[] = saved ? JSON.parse(saved) : [];
  const remaining = sales.filter((s) => s.timestamp !== sale.timestamp);
  localStorage.setItem('pos-suspended-sales', JSON.stringify(remaining));
  notification.info('Sale removed', 'Suspended sale deleted.');
}

function handleCartRecovery() {
  showCartRecovery.value = false;
  notification.info('Sale restored', 'Your previous cart has been recovered.');
}

function handleDiscardCart() {
  clearCart();
  showCartRecovery.value = false;
  notification.info('Cart cleared', 'Previous cart was discarded.');
}

const searchBarRef = ref<any>(null);

onMounted(() => {
  clockTimer = setInterval(() => { now.value = new Date(); }, 1000);

  const hasSavedCart = localStorage.getItem('pos-cart');
  if (hasSavedCart && items.value.length > 0) {
    showCartRecovery.value = true;
  }

  const handler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (e.key === 'F2' && !isInput) { e.preventDefault(); searchBarRef.value?.focus(); }
    if (e.key === 'F8' && !isInput) { e.preventDefault(); handleSuspend(); }
    if (e.key === 'F9' && !isInput) { e.preventDefault(); if (!isEmpty.value) paymentDrawerOpen.value = true; }
    if (e.key === 'F10' && !isInput) { e.preventDefault(); if (!isEmpty.value) handleCheckout(); }
    if (e.key === 'Delete' && e.ctrlKey && !isInput) { e.preventDefault(); clearCart(); }
    if (e.key === 'Enter' && !isInput) {
      if (!paymentDrawerOpen.value && !showReceipt.value && !isEmpty.value) handleCheckout();
    }
  };

  document.addEventListener('keydown', handler);
  onUnmounted(() => {
    clearInterval(clockTimer);
    document.removeEventListener('keydown', handler);
  });
});
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">

    <!-- Top Bar -->
    <div class="border-b px-4 py-2 flex items-center justify-between bg-card shrink-0">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-bold">SmartShop POS</h1>
        <div v-if="shiftStore.isShiftOpen" class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock class="w-3.5 h-3.5" />
          <span>{{ shiftStore.shiftDuration }}</span>
        </div>
      </div>

      <!-- Toggle Buttons + Status -->
      <div class="flex items-center gap-2">
        <!-- Quick Actions toggle -->
        <Button
          variant="ghost"
          size="sm"
          :class="showQuickActions ? 'bg-muted' : ''"
          class="gap-1.5 text-xs h-8"
          @click="showQuickActions = !showQuickActions; showRecentSales = false"
        >
          <Zap class="w-3.5 h-3.5" />
          Quick Actions
        </Button>

        <!-- Recent Sales toggle -->
        <Button
          variant="ghost"
          size="sm"
          :class="showRecentSales ? 'bg-muted' : ''"
          class="gap-1.5 text-xs h-8"
          @click="showRecentSales = !showRecentSales; showQuickActions = false"
        >
          <History class="w-3.5 h-3.5" />
          Recent Sales
        </Button>

        <div class="w-px h-5 bg-border mx-1" />

        <div :class="isOnline ? 'text-green-600' : 'text-red-600'" class="flex items-center gap-1 text-xs">
          <Wifi v-if="isOnline" class="w-3.5 h-3.5" />
          <WifiOff v-else class="w-3.5 h-3.5" />
        </div>
        <span class="text-xs text-muted-foreground">{{ auth.user?.firstName || 'Cashier' }}</span>
        <div class="flex items-center gap-1 text-xs font-mono text-foreground">
          <Clock class="w-3.5 h-3.5 text-muted-foreground" />
          <span>{{ localTime }}</span>
        </div>
        <span
          class="px-2 py-0.5 rounded-full text-xs font-medium"
          :class="shiftStore.drawerStatus === 'open'
            ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'"
        >
          {{ shiftStore.drawerStatus === 'open' ? 'Drawer Open' : 'Drawer Closed' }}
        </span>
      </div>
    </div>

    <!-- Cart Recovery Banner -->
    <div
      v-if="showCartRecovery"
      class="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between shrink-0"
    >
      <span class="text-sm text-amber-800 dark:text-amber-200 font-medium">
        Unsaved sale found — Resume or Discard?
      </span>
      <div class="flex gap-2">
        <Button size="sm" variant="outline" @click="handleDiscardCart">Discard</Button>
        <Button size="sm" @click="handleCartRecovery">Resume</Button>
      </div>
    </div>

    <!-- Toggle Panel (Quick Actions or Recent Sales) -->
    <transition name="panel-slide">
      <div
        v-if="showQuickActions || showRecentSales"
        class="border-b bg-card px-4 py-3 shrink-0"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <QuickActions
              v-if="showQuickActions"
              @suspend="handleSuspend"
              @recall="suspendDialogOpen = true"
              @discount="paymentDrawerOpen = true"
              @split="paymentDrawerOpen = true"
              @clear="clearCart"
            />
            <RecentSales v-else-if="showRecentSales" :limit="5" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 shrink-0 mt-0.5"
            @click="showQuickActions = false; showRecentSales = false"
          >
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </transition>

    <!-- Search Bar -->
    <div class="border-b px-4 py-2 shrink-0">
      <SearchBar
        ref="searchBarRef"
        v-model="searchQuery"
        placeholder="Search products, SKU, barcode... (F2)"
        @search="searchQuery = $event"
        @barcode="handleBarcode"
        @clear="clearCart"
      />
    </div>

    <!-- Main Content — fills all remaining height -->
    <div class="flex-1 overflow-hidden flex gap-0">

      <!-- Left: Products -->
      <div class="flex-1 overflow-hidden flex flex-col p-4 pr-2">

        <!-- Pinned shortcuts -->
        <ProductShortcuts
          v-if="pinnedProductIds.length > 0"
          :products="products"
          :pinned-ids="pinnedProductIds"
          @select="handleShortcutSelect"
        />

        <!-- Category Filters + View Toggle -->
        <div class="flex items-center justify-between gap-2 mb-3">
          <div
            v-if="displayedCategories.length > 1"
            class="flex gap-1.5 overflow-x-auto scrollbar-hide"
          >
            <button
              v-for="cat in displayedCategories"
              :key="cat.id || 'all'"
              @click="selectedCategory = cat.id"
              :class="[
                'px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80',
              ]"
            >
              {{ cat.name }}
            </button>
          </div>
          <div class="flex border rounded-lg shrink-0 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              class="h-7 w-7 p-0"
              :class="{ 'bg-muted': viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <Grid3X3 class="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 w-7 p-0"
              :class="{ 'bg-muted': viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <LayoutList class="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <!-- Product Grid/List -->
        <div class="flex-1 overflow-y-auto">
          <ProductGrid
            :products="filteredProducts"
            :loading="productsLoading"
            :search-query="searchQuery"
            :selected-category="selectedCategory"
            :pinned-ids="pinnedProductIds"
            :view-mode="viewMode"
            @select="handleProductSelect"
            @pin="togglePin"
          />
        </div>
      </div>

      <!-- Right: Cart Panel -->
      <div class="w-[360px] shrink-0 flex flex-col border-l overflow-hidden p-4 pl-2 gap-2">

        <!-- Customer -->
        <CustomerLookup
          :selected-customer="customerId ? { id: customerId, name: customerName || '' } : null"
          @select="setCustomer"
          @clear="clearCustomer"
        />

        <!-- Cart (fills remaining space) -->
        <div class="flex-1 overflow-hidden flex flex-col min-h-0">
          <CartSummary
            :items="items"
            :subtotal="subtotal"
            :discount="totalDiscount"
            :tax="tax"
            :total="total"
            :item-count="itemCount"
            :taxes="taxes"
            :selected-tax-id="selectedTaxId"
            @update-qty="updateQuantity"
            @remove="removeItem"
            @discount="setDiscount"
            @note="setNote"
            @clear="clearCart"
            @set-tax="setTax"
          />
        </div>

        <!-- Action Buttons — always visible at bottom -->
        <div class="space-y-2 shrink-0">
          <Button
            class="w-full h-12 text-base font-bold"
            :disabled="isProcessing || isEmpty || productsLoading"
            @click="handleCheckout"
          >
            {{ isProcessing ? 'Processing...' : `Complete Sale — KES ${total.toLocaleString()}` }}
          </Button>
          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" class="w-full" @click="handleSuspend" :disabled="isEmpty">
              Suspend (F8)
            </Button>
            <Button variant="ghost" class="w-full" @click="clearCart" :disabled="isEmpty">
              Clear (Ctrl+Del)
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Drawer -->
    <PaymentDrawer
      :open="paymentDrawerOpen"
      :total="total"
      @close="paymentDrawerOpen = false"
      @pay="handlePayment"
    />

    <!-- Receipt Overlay -->
    <div
      v-if="showReceipt && receiptData"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="max-w-md w-full max-h-[80vh] overflow-y-auto">
        <ReceiptPreview
          :receipt="receiptData"
          @print="showReceipt = false; notification.success('Receipt printed')"
          @email="showReceipt = false; notification.success('Receipt sent via email')"
          @sms="showReceipt = false; notification.success('Receipt sent via SMS')"
        />
        <div class="flex justify-center mt-4">
          <Button @click="showReceipt = false">Close</Button>
        </div>
      </div>
    </div>

    <!-- Suspend Sale Dialog -->
    <SuspendSaleDialog
      :open="suspendDialogOpen"
      :sales="getSuspendedSales()"
      @close="suspendDialogOpen = false"
      @resume="handleResume"
      @delete="handleDeleteSuspended"
    />
  </div>
</template>

<style scoped>
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.panel-slide-enter-to,
.panel-slide-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>
