<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Package,
  Move3D,
  ClipboardList,
  BarChart3,
} from '@lucide/vue';
import CatalogWorkspace from '@/modules/catalog/components/CatalogWorkspace.vue';
import InventoryOverview from '@/modules/inventory/components/InventoryOverview.vue';
import InventoryProductTable from '@/modules/inventory/components/InventoryProductTable.vue';
import StockMovementTimeline from '@/modules/inventory/components/StockMovementTimeline.vue';
import InventoryFilters from '@/modules/inventory/components/InventoryFilters.vue';
import BulkActionBar from '@/modules/inventory/components/BulkActionBar.vue';
import GoodsReceivingWizard from '@/modules/inventory/components/GoodsReceivingWizard.vue';
import TransferStockDialog from '@/modules/inventory/components/TransferStockDialog.vue';
import AdjustmentDialog from '@/modules/inventory/components/AdjustmentDialog.vue';
import CycleCountView from '@/modules/inventory/components/CycleCountView.vue';
import CycleCountDialog from '@/modules/inventory/components/CycleCountDialog.vue';
import { useWarehouses, useStockLevels, useStockMovements } from '@/modules/inventory/composables/useInventory';
import { useProducts } from '@/modules/catalog/composables/useProducts';
import type { Product } from '@/shared/types';
import { notification } from '@/stores/notification';

const activeTab = ref('overview');
const searchQuery = ref('');
const selectedProducts = ref<Set<string>>(new Set());
const selectedWarehouse = ref<string | null>(null);

const tabs = [
  { label: 'Overview', value: 'overview', icon: BarChart3 },
  { label: 'Products', value: 'products', icon: Package },
  { label: 'Stock Levels', value: 'stock', icon: Package },
  { label: 'Movements', value: 'movements', icon: Move3D },
  { label: 'Transfers', value: 'transfers', icon: Move3D },
  { label: 'Adjustments', value: 'adjustments', icon: ClipboardList },
  { label: 'Cycle Counts', value: 'cycles', icon: ClipboardList },
];

const warehouseId = () => selectedWarehouse.value ?? null;

const { data: warehouses } = useWarehouses();
const { products: allProducts, isLoading: productsLoading } = useProducts();
const { stockData, isLoading: stockLoading } = useStockLevels(warehouseId);
const { data: movementsData } = useStockMovements(() => ({
  warehouseId: selectedWarehouse.value ?? undefined,
  page: 1,
  limit: 100,
}));

const products = computed(() => (allProducts.value ?? []) as Product[]);
const stocks = computed(() => stockData?.value ?? []);
const movements = computed(() => movementsData?.value?.items ?? []);

const lowStockCount = computed(() => {
  return products.value.filter(
    (p) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 0),
  ).length;
});

const outOfStockCount = computed(() => products.value.filter((p) => (p.stockQuantity ?? 0) === 0).length);
const totalProducts = computed(() => products.value.length);
const inventoryValue = computed(() =>
  products.value.reduce((sum, p) => sum + (p.stockQuantity ?? 0) * Number(p.costPrice), 0),
);

const todayMovements = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return movements.value.filter((m) => m.createdAt.startsWith(today)).length;
});

const productsWithStock = computed(() => {
  const stockMap = new Map(stocks.value.map((s) => [s.productId, s]));
  return products.value.map((p) => {
    const stock = stockMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      sku: p.sku ?? null,
      sellingPrice: Number(p.sellingPrice),
      stockQuantity: stock?.quantity ?? 0,
      reservedQuantity: stock?.reservedQuantity ?? 0,
      lowStockThreshold: p.lowStockThreshold ?? 0,
      isActive: p.isActive,
      categoryName: p.categoryName,
      brandName: p.brandName,
    };
  });
});

const filteredProducts = computed(() => {
  let result = productsWithStock.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.code?.toLowerCase().includes(q)) || (p.sku?.toLowerCase()?.includes(q) ?? false),
    );
  }
  return result;
});

const selectedCount = computed(() => selectedProducts.value.size);

const showReceivingWizard = ref(false);
const showTransferDialog = ref(false);
const showAdjustmentDialog = ref(false);
const showCycleCount = ref(false);

function handleTabChange(value: string) {
  activeTab.value = value;
  selectedProducts.value.clear();
}

function handleFocusSearch() {
  notification.info('Search', 'Press Ctrl+K to focus search');
}

function handleClearFilters() {
  searchQuery.value = '';
  selectedWarehouse.value = null;
}

function handleExport() {
  notification.success('Export', 'Export started');
}

function handlePrimaryAction() {
  if (activeTab.value === 'products') {
    window.open('/inventory/products/create', '_self');
  } else if (activeTab.value === 'transfers') {
    showTransferDialog.value = true;
  } else if (activeTab.value === 'adjustments') {
    showAdjustmentDialog.value = true;
  } else if (activeTab.value === 'cycles') {
    showCycleCount.value = true;
  }
}

function handleReceiveGoods() {
  showReceivingWizard.value = true;
}

function handleExportCsv() {
  notification.success('Export', `Exporting ${selectedCount.value} products to CSV`);
}

function handlePrintLabels() {
  if (selectedCount.value === 0) {
    notification.warning('Print Labels', 'Select products to print labels');
    return;
  }
  notification.success('Print Labels', `Printing labels for ${selectedCount.value} products`);
}

function handleArchiveSelected() {
  if (selectedCount.value === 0) {
    notification.warning('Archive', 'Select products to archive');
    return;
  }
  notification.success('Archive', `Archived ${selectedCount.value} products`);
}

function handleDeleteSelected() {
  if (selectedCount.value === 0) {
    notification.warning('Delete', 'Select products to delete');
    return;
  }
  notification.success('Delete', `Deleted ${selectedCount.value} products`);
}

onMounted(() => {
  const defaultWarehouse = warehouses.value?.find((w) => w.isDefault);
  if (defaultWarehouse) {
    selectedWarehouse.value = defaultWarehouse.id;
  }
});
</script>

<template>
  <CatalogWorkspace
    title="Inventory"
    description="Browse, inspect, and manage all inventory across warehouses"
    :workspace-icon="Package"
    :tabs="tabs"
    :active-tab="activeTab"
    @update:activeTab="handleTabChange"
    @focus-search="handleFocusSearch"
    @clear-filters="handleClearFilters"
    @export="handleExport"
    @primary-action="handlePrimaryAction"
  >
    <template #search>
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search products, SKU, barcode... (Press / to focus)"
        class="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </template>

    <template #filters>
      <InventoryFilters
        :warehouses="warehouses"
        :selected-warehouse="selectedWarehouse"
        @update:warehouse="selectedWarehouse = $event"
        @receive-goods="handleReceiveGoods"
      />
    </template>

    <InventoryOverview
      v-if="activeTab === 'overview'"
      :products="products"
      :stock-levels="stocks"
      :movements="movements"
      :low-stock-count="lowStockCount"
      :out-of-stock-count="outOfStockCount"
      :total-products="totalProducts"
      :inventory-value="inventoryValue"
      :today-movements="todayMovements"
      @view-low-stock="activeTab = 'products'"
      @view-out-of-stock="activeTab = 'products'"
      @receive-goods="handleReceiveGoods"
    />

    <InventoryProductTable
      v-else-if="activeTab === 'products' || activeTab === 'stock'"
      :products="filteredProducts"
      :loading="productsLoading || stockLoading"
      :show-stock-columns="activeTab === 'stock'"
      :selected-products="selectedProducts"
      @update:selected="selectedProducts = $event"
    />

    <StockMovementTimeline
      v-else-if="activeTab === 'movements'"
      :movements="movements"
      :warehouses="warehouses"
      :selected-warehouse="selectedWarehouse"
    />

    <div
      v-else-if="activeTab === 'transfers'"
      class="text-center py-12 text-muted-foreground"
    >
      <Move3D class="h-12 w-12 mx-auto mb-3 opacity-20" />
      <h3 class="font-medium mb-2">Transfer Stock</h3>
      <p class="text-sm">Move products between warehouses.</p>
    </div>

    <div
      v-else-if="activeTab === 'adjustments'"
      class="text-center py-12 text-muted-foreground"
    >
      <ClipboardList class="h-12 w-12 mx-auto mb-3 opacity-20" />
      <h3 class="font-medium mb-2">Stock Adjustments</h3>
      <p class="text-sm">Record stock changes with a required reason.</p>
    </div>

    <CycleCountView
      v-else-if="activeTab === 'cycles'"
      :products="products"
    />

    <template #footer>
      <BulkActionBar
        :selected-count="selectedCount"
        @export="handleExportCsv"
        @print-labels="handlePrintLabels"
        @archive="handleArchiveSelected"
        @delete="handleDeleteSelected"
      />
    </template>
  </CatalogWorkspace>

  <GoodsReceivingWizard v-model:open="showReceivingWizard" :warehouses="warehouses" />
  <TransferStockDialog v-model:open="showTransferDialog" :warehouses="warehouses" :products="products" />
  <AdjustmentDialog v-model:open="showAdjustmentDialog" :warehouses="warehouses" :products="products" />
  <CycleCountDialog v-model:open="showCycleCount" :products="products" />
</template>
