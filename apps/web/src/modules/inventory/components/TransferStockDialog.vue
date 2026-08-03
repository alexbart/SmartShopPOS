<script setup lang="ts">
import { ref, computed } from 'vue';
import { Package, Warehouse, Move3D, Search, Check } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Warehouse as WarehouseType, Product } from '@/shared/types';
import { useTransferStock } from '@/modules/inventory/composables/useInventory';
import { notification } from '@/stores/notification';

const props = withDefaults(
  defineProps<{
    open: boolean;
    warehouses: WarehouseType[];
    products: Product[];
  }>(),
  {
    open: false,
    warehouses: () => [],
    products: () => [],
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const fromWarehouse = ref<string | null>(null);
const toWarehouse = ref<string | null>(null);
const searchQuery = ref('');
const transferQty = ref(1);
const selectedProduct = ref<Product | null>(null);

const transferMutation = useTransferStock();

const filteredProducts = computed(() => {
  if (!searchQuery.value) return props.products.slice(0, 20);
  const q = searchQuery.value.toLowerCase();
  return props.products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.code?.toLowerCase().includes(q) ?? false) ||
      (p.sku?.toLowerCase().includes(q) ?? false),
  );
});

const availableQuantity = computed(() => {
  if (!selectedProduct.value) return 0;
  return selectedProduct.value.stockQuantity ?? 0;
});

function handleClose() {
  resetDialog();
  emit('update:open', false);
}

function resetDialog() {
  fromWarehouse.value = null;
  toWarehouse.value = null;
  searchQuery.value = '';
  transferQty.value = 1;
  selectedProduct.value = null;
}

async function confirmTransfer() {
  if (!fromWarehouse.value || !toWarehouse.value || !selectedProduct.value) return;
  if (fromWarehouse.value === toWarehouse.value) {
    notification.error('Invalid transfer', 'Source and destination must be different');
    return;
  }

  try {
    await transferMutation.mutateAsync({
      fromWarehouseId: fromWarehouse.value,
      toWarehouseId: toWarehouse.value,
      productId: selectedProduct.value.id,
      quantity: transferQty.value,
      remarks: `Transferred ${transferQty.value} x ${selectedProduct.value.name}`,
    });
    notification.success('Transfer complete', `Moved ${transferQty.value} units`);
    handleClose();
  } catch (error) {
    notification.error('Transfer failed', 'Could not transfer stock');
  }
}

function canConfirm() {
  return (
    fromWarehouse.value &&
    toWarehouse.value &&
    selectedProduct.value &&
    fromWarehouse.value !== toWarehouse.value &&
    transferQty.value > 0 &&
    transferQty.value <= availableQuantity.value
  );
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
      <div class="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold">Transfer Stock</h2>
          <Button variant="ghost" size="sm" @click="handleClose">
            <Package class="w-4 h-4" />
          </Button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <Card>
              <CardContent class="p-4">
                <h3 class="font-medium mb-2 flex items-center gap-2">
                  <Warehouse class="w-4 h-4" />
                  From Warehouse
                </h3>
                <div class="space-y-2">
                  <button
                    v-for="w in warehouses"
                    :key="w.id"
                    @click="fromWarehouse = w.id; toWarehouse = toWarehouse === w.id ? null : toWarehouse"
                    :class="[
                      'w-full flex items-center gap-2 p-2 rounded border text-left transition-all',
                      fromWarehouse === w.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/30',
                      { 'opacity-50': toWarehouse === w.id },
                    ]"
                    :disabled="toWarehouse === w.id"
                  >
                    <Warehouse class="w-4 h-4" />
                    <span class="text-sm">{{ w.name }}</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="p-4">
                <h3 class="font-medium mb-2 flex items-center gap-2">
                  <Warehouse class="w-4 h-4" />
                  To Warehouse
                </h3>
                <div class="space-y-2">
                  <button
                    v-for="w in warehouses"
                    :key="w.id"
                    @click="toWarehouse = w.id; fromWarehouse = fromWarehouse === w.id ? null : fromWarehouse"
                    :class="[
                      'w-full flex items-center gap-2 p-2 rounded border text-left transition-all',
                      toWarehouse === w.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/30',
                      { 'opacity-50': fromWarehouse === w.id },
                    ]"
                    :disabled="fromWarehouse === w.id"
                  >
                    <Warehouse class="w-4 h-4" />
                    <span class="text-sm">{{ w.name }}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div v-if="fromWarehouse && toWarehouse" class="space-y-4">
            <h3 class="font-medium">Select Product</h3>
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search products..."
                class="w-full pl-8 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div class="space-y-2 max-h-48 overflow-y-auto">
              <button
                v-for="product in filteredProducts"
                :key="product.id"
                @click="selectedProduct = product"
                :class="[
                  'w-full flex items-center gap-3 p-3 rounded border text-left transition-all',
                  selectedProduct?.id === product.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/30',
                ]"
              >
                <Package class="w-5 h-5 text-muted-foreground" />
                <div class="flex-1">
                  <p class="font-medium">{{ product.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    SKU: {{ product.sku }} · Stock: {{ product.stockQuantity }}
                  </p>
                </div>
                <Check v-if="selectedProduct?.id === product.id" class="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>

          <div v-if="selectedProduct" class="space-y-4">
            <h3 class="font-medium">Transfer Quantity</h3>
            <div class="flex items-center gap-4">
              <input
                type="number"
                min="1"
                :max="availableQuantity"
                v-model.number="transferQty"
                class="w-20 h-10 text-center text-lg font-bold rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span class="text-sm text-muted-foreground">
                of {{ availableQuantity }} available
              </span>
            </div>
          </div>
        </div>

        <div class="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" @click="handleClose">
            Cancel
          </Button>
          <Button
            @click="confirmTransfer"
            :disabled="!canConfirm()"
            :loading="transferMutation.isPending"
          >
            <Move3D class="w-4 h-4 mr-2" />
            Transfer Stock
          </Button>
        </div>
      </div>
    </div>
  </transition>
</template>
