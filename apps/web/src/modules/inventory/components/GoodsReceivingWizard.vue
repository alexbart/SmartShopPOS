<script setup lang="ts">
import { ref, computed } from 'vue';
import { Package, Warehouse, Search, Plus, Trash2, X } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Warehouse as WarehouseType, Product } from '@/shared/types';
import { useReceiveStock } from '@/modules/inventory/composables/useInventory';
import { notification } from '@/stores/notification';

const props = withDefaults(
  defineProps<{
    open: boolean;
    warehouses: WarehouseType[];
  }>(),
  {
    open: false,
    warehouses: () => [],
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const currentStep = ref(1);
const selectedProducts = ref<
  Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    total: number;
  }>
>([]);
const receivingWarehouse = ref<string | null>(null);
const searchQuery = ref('');

const receiveMutation = useReceiveStock();

const steps = [
  { number: 1, label: 'Choose Warehouse' },
  { number: 2, label: 'Add Products' },
  { number: 3, label: 'Review Quantities' },
  { number: 4, label: 'Confirm' },
];

const filteredProducts = computed(() => {
  if (!searchQuery.value) return [];
  const q = searchQuery.value.toLowerCase();
  return props.warehouses;
});

const totalReceived = computed(() => {
  return selectedProducts.value.reduce((sum, p) => sum + p.total, 0);
});

function nextStep() {
  if (currentStep.value < steps.length) currentStep.value++;
}

const isNotLastStep = computed(() => currentStep.value < steps.length);
const isNotFirstStep = computed(() => currentStep.value > 1);

function prevStep() {
  if (currentStep.value > 1) currentStep.value--;
}

function isLastStep(step: { number: number }): boolean {
  return step.number >= steps.length;
}

function addProduct(product: Product) {
  if (selectedProducts.value.find((p) => p.productId === product.id)) return;
  selectedProducts.value.push({
    productId: product.id,
    productName: product.name,
    sku: product.sku ?? '',
    quantity: 1,
    unitCost: Number(product.costPrice),
    total: Number(product.costPrice),
  });
}

function updateQuantity(index: number, qty: number) {
  const item = selectedProducts.value[index];
  item.quantity = qty;
  item.total = qty * item.unitCost;
}

function removeProduct(index: number) {
  selectedProducts.value.splice(index, 1);
}

async function confirmReceiving() {
  try {
    for (const item of selectedProducts.value) {
      await receiveMutation.mutateAsync({
        warehouseId: receivingWarehouse.value!,
        productId: item.productId,
        quantity: item.quantity,
        remarks: `Received ${item.quantity} units via goods receiving wizard`,
      });
    }
    notification.success('Receiving complete', `${selectedProducts.value.length} items received`);
    emit('update:open', false);
  } catch (error) {
    notification.error('Receiving failed', 'Could not update stock');
  }
}

function resetWizard() {
  currentStep.value = 1;
  selectedProducts.value = [];
  receivingWarehouse.value = null;
  searchQuery.value = '';
}

function handleClose() {
  resetWizard();
  emit('update:open', false);
}
</script>

<template>
  <transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
      <div class="relative w-full max-w-3xl bg-background border border-border rounded-t-2xl sm:rounded-xl shadow-xl m-0 sm:m-4 overflow-hidden">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold">Receive Goods</h2>
          <Button variant="ghost" size="sm" @click="handleClose">
            <X class="w-4 h-4" />
          </Button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <div class="flex items-center gap-4 mb-6">
            <div
              v-for="step in steps"
              :key="step.number"
              class="flex items-center"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                :class="currentStep >= step.number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
              >
                {{ step.number }}
              </div>
              <span v-if="!isLastStep(step)" class="w-8 h-px bg-border mx-1"></span>
              <span class="text-sm font-medium">{{ step.label }}</span>
            </div>
          </div>

          <div v-if="currentStep === 1">
            <h3 class="font-medium mb-3">Select Receiving Warehouse</h3>
            <div class="space-y-2">
              <button
                v-for="warehouse in warehouses"
                :key="warehouse.id"
                @click="receivingWarehouse = warehouse.id"
                :class="[
                  'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                  receivingWarehouse === warehouse.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/30',
                ]"
              >
                <Warehouse class="w-5 h-5" />
                <div>
                  <p class="font-medium">{{ warehouse.name }}</p>
                  <p class="text-sm text-muted-foreground">{{ warehouse.code }}</p>
                </div>
              </button>
            </div>
            <Button
              v-if="!receivingWarehouse"
              variant="ghost"
              size="sm"
              class="mt-3"
              @click="receivingWarehouse = warehouses.find((w) => w.isDefault)?.id ?? null"
            >
              Use default warehouse
            </Button>
          </div>

          <div v-else-if="currentStep === 2">
            <h3 class="font-medium mb-3">Add Products</h3>
            <div class="relative mb-4">
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search by name, SKU, barcode..."
                class="w-full pl-8 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p class="text-sm text-muted-foreground mb-3">
              {{ selectedProducts.length }} product(s) added
            </p>
            <div v-if="selectedProducts.length > 0" class="space-y-2 mb-4">
              <div
                v-for="(item, i) in selectedProducts"
                :key="item.productId"
                class="flex items-center justify-between p-2 bg-muted/20 rounded"
              >
                <span class="text-sm">{{ item.productName }}</span>
                <Button variant="ghost" size="sm" @click="removeProduct(i)">
                  <Trash2 class="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 3">
            <h3 class="font-medium mb-3">Review Quantities</h3>
            <div class="space-y-3">
              <div
                v-for="(item, i) in selectedProducts"
                :key="item.productId"
                class="flex items-center gap-3"
              >
                <Package class="w-5 h-5 text-muted-foreground" />
                <div class="flex-1">
                  <p class="font-medium">{{ item.productName }}</p>
                  <p class="text-xs text-muted-foreground">SKU: {{ item.sku }}</p>
                </div>
                <input
                  type="number"
                  min="1"
                  v-model.number="item.quantity"
                  @input="updateQuantity(i, item.quantity)"
                  class="w-16 h-8 text-center rounded border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div class="w-20 text-right">
                  <p class="font-medium">KES {{ item.total.toFixed(2) }}</p>
                  <p class="text-xs text-muted-foreground">unit: KES {{ item.unitCost.toFixed(2) }}</p>
                </div>
              </div>
            </div>
            <div class="border-t pt-4 mt-4">
              <div class="flex justify-between text-sm">
                <span>Subtotal</span>
                <span class="font-medium">KES {{ totalReceived.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 4">
            <h3 class="font-medium mb-3">Confirm Receipt</h3>
            <Card>
              <CardContent class="p-4">
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Warehouse</span>
                    <span>{{ warehouses.find((w) => w.id === receivingWarehouse)?.name }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Items</span>
                    <span>{{ selectedProducts.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Total Value</span>
                    <span class="font-bold">KES {{ totalReceived.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Created</span>
                    <span>{{ new Date().toLocaleString() }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div class="border-t px-6 py-4 flex justify-between items-center">
          <Button v-if="currentStep > 1" variant="outline" @click="prevStep">
            Back
          </Button>
          <div v-else></div>

          <div class="flex gap-2">
            <Button variant="ghost" @click="handleClose">
              Cancel
            </Button>
            <Button
              v-if="isNotLastStep"
              @click="nextStep"
              :disabled="currentStep === 1 && !receivingWarehouse"
            >
              Next
            </Button>
            <Button
              v-else
              @click="confirmReceiving"
              :loading="receiveMutation.isPending"
            >
              Receive Goods
            </Button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
