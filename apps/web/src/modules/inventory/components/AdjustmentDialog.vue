<script setup lang="ts">
import { ref, computed } from 'vue';
import { Package, Warehouse, PenTool, Trash2, AlertCircle } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Warehouse as WarehouseType, Product } from '@/shared/types';
import { useAdjustStock } from '@/modules/inventory/composables/useInventory';
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

const selectedWarehouse = ref<string | null>(null);
const searchQuery = ref('');
const selectedProduct = ref<Product | null>(null);
const adjustmentType = ref<'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED'>('ADJUSTMENT');
const adjustmentQty = ref(0);
const adjustmentReason = ref('');
const adjustmentNotes = ref('');

const adjustMutation = useAdjustStock();

const reasonOptions = [
  { value: 'DAMAGE', label: 'Damaged goods' },
  { value: 'EXPIRED', label: 'Expired products' },
  { value: 'THEFT', label: 'Theft/Shrinkage' },
  { value: 'BREAKAGE', label: 'Breakage' },
  { value: 'COUNT', label: 'Physical count difference' },
  { value: 'OTHER', label: 'Other' },
];

const filteredProducts = computed(() => {
  if (!searchQuery.value) return props.products.slice(0, 20);
  const q = searchQuery.value.toLowerCase();
  return props.products.filter(
    (p) => p.name.toLowerCase().includes(q) || (p.code?.toLowerCase().includes(q) ?? false),
  );
});

const stockLevel = computed(() => {
  if (!selectedProduct.value) return 0;
  return selectedProduct.value.stockQuantity ?? 0;
});

const newStockLevel = computed(() => stockLevel.value + adjustmentQty.value);

function handleClose() {
  resetDialog();
  emit('update:open', false);
}

function resetDialog() {
  selectedWarehouse.value = null;
  searchQuery.value = '';
  selectedProduct.value = null;
  adjustmentType.value = 'ADJUSTMENT';
  adjustmentQty.value = 0;
  adjustmentReason.value = '';
  adjustmentNotes.value = '';
}

async function confirmAdjustment() {
  if (!selectedProduct.value || !selectedWarehouse.value || !adjustmentReason.value) {
    notification.error('Missing fields', 'Please select a product and reason');
    return;
  }

  try {
    await adjustMutation.mutateAsync({
      warehouseId: selectedWarehouse.value,
      productId: selectedProduct.value.id,
      quantity: adjustmentQty.value,
      type: adjustmentType.value,
      remarks: `${adjustmentReason.value}: ${adjustmentNotes.value}`,
    });
    notification.success('Adjustment recorded', `Stock adjusted by ${adjustmentQty.value}`);
    handleClose();
  } catch (error) {
    notification.error('Adjustment failed', 'Could not adjust stock');
  }
}

function canConfirm() {
  return selectedProduct.value && selectedWarehouse.value && adjustmentReason.value && adjustmentQty.value !== 0;
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
      <div class="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <PenTool class="w-5 h-5 text-primary" />
            <h2 class="text-xl font-bold">Adjust Stock</h2>
          </div>
          <Button variant="ghost" size="sm" @click="handleClose">
            <Package class="w-4 h-4" />
          </Button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          <div v-if="!selectedWarehouse">
            <h3 class="font-medium mb-3">Select Warehouse</h3>
            <div class="space-y-2">
              <button
                v-for="w in warehouses"
                :key="w.id"
                @click="selectedWarehouse = w.id"
                class="w-full flex items-center gap-2 p-3 rounded border border-border hover:bg-muted/30 text-left transition-all"
              >
                <Warehouse class="w-5 h-5 text-muted-foreground" />
                <div>
                  <p class="font-medium">{{ w.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ w.code }}</p>
                </div>
              </button>
            </div>
          </div>

          <div v-else-if="!selectedProduct">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium">Select Product</h3>
              <Button variant="ghost" size="sm" @click="selectedWarehouse = null">
                Change Warehouse
              </Button>
            </div>
            <div class="relative mb-4">
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search products..."
                class="w-full pl-3 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <button
                v-for="product in filteredProducts"
                :key="product.id"
                @click="selectedProduct = product"
                class="w-full flex items-center gap-3 p-3 rounded border border-border hover:bg-muted/30 text-left transition-all"
              >
                <Package class="w-5 h-5 text-muted-foreground" />
                <div class="flex-1">
                  <p class="font-medium">{{ product.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    SKU: {{ product.sku }} · Stock: {{ product.stockQuantity }}
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div v-else>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-medium">Adjustment Details</h3>
                <Button variant="ghost" size="sm" @click="selectedProduct = null">
                  Change Product
                </Button>
              </div>

              <Card>
                <CardContent class="p-4">
                  <p class="font-medium">{{ selectedProduct.name }}</p>
                  <p class="text-sm text-muted-foreground mb-2">
                    SKU: {{ selectedProduct.sku }} · Current Stock: {{ stockLevel }}
                  </p>

                  <div class="space-y-3 pt-2">
                    <div>
                      <label class="text-sm font-medium mb-1 block">Adjustment Type</label>
                      <div class="grid grid-cols-3 gap-2">
                        <button
                          v-for="type in ['ADJUSTMENT', 'DAMAGE', 'EXPIRED']"
                          :key="type"
                          @click="adjustmentType = type as typeof adjustmentType.value"
                          :class="[
                            'p-2 rounded border text-sm transition-all',
                            adjustmentType === type
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:bg-muted/30',
                          ]"
                        >
                          {{ type }}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label class="text-sm font-medium mb-1 block">Quantity</label>
                      <input
                        type="number"
                        v-model.number="adjustmentQty"
                        :class="[
                          'w-full h-10 text-center text-lg font-bold rounded-md border focus:outline-none focus:ring-2 focus:ring-ring',
                          adjustmentQty > 0 ? 'border-green-500' : 'border-red-500',
                        ]"
                      />
                      <p class="text-xs text-muted-foreground mt-1 text-center">
                        Use + for increase, – for decrease
                      </p>
                    </div>

                    <div class="flex items-center gap-2 text-sm">
                      <span>Current stock:</span>
                      <Badge variant="outline">{{ stockLevel }}</Badge>
                      <span>→</span>
                      <Badge
                        :variant="newStockLevel >= 0 ? 'default' : 'destructive'"
                      >
                        {{ newStockLevel }}
                      </Badge>
                    </div>

                    <div>
                      <label class="text-sm font-medium mb-1 block">
                        Reason <span class="text-red-500">*</span>
                      </label>
                      <select
                        v-model="adjustmentReason"
                        class="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select a reason...</option>
                        <option v-for="r in reasonOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="text-sm font-medium mb-1 block">Notes (optional)</label>
                      <textarea
                        v-model="adjustmentNotes"
                        rows="2"
                        placeholder="Additional details..."
                        class="w-full px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      ></textarea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div class="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" @click="handleClose">
            Cancel
          </Button>
          <Button
            @click="confirmAdjustment"
            :disabled="!canConfirm()"
            :loading="adjustMutation.isPending"
          >
            <AlertCircle class="w-4 h-4 mr-2" />
            Record Adjustment
          </Button>
        </div>
      </div>
    </div>
  </transition>
</template>
