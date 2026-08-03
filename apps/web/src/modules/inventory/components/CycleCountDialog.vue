<script setup lang="ts">
import { ref, computed } from 'vue';
import { Package, Check, X as XIcon, AlertCircle } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import type { Product } from '@/shared/types';

const props = withDefaults(
  defineProps<{
    open: boolean;
    products: Product[];
  }>(),
  {
    open: false,
    products: () => [],
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const selectedCategory = ref<string | null>(null);
const expectedQty = ref<number | null>(null);
const countedQty = ref<number | null>(null);
const adjustmentReason = ref('');
const adjustmentNotes = ref('');

const selectedProduct = ref<Product | null>(null);

const categories = computed(() => {
  const cats = new Set<string>();
  props.products.forEach((p) => {
    if (p.categoryName) cats.add(p.categoryName);
  });
  return Array.from(cats);
});

const filteredProducts = computed(() => {
  let result = props.products;
  if (selectedCategory.value) {
    result = result.filter((p) => p.categoryName === selectedCategory.value);
  }
  return result;
});

const variance = computed(() => {
  if (expectedQty.value === null || countedQty.value === null) return null;
  return countedQty.value - expectedQty.value;
});

function handleClose() {
  resetDialog();
  emit('update:open', false);
}

function resetDialog() {
  selectedCategory.value = null;
  selectedProduct.value = null;
  expectedQty.value = null;
  countedQty.value = null;
  adjustmentReason.value = '';
  adjustmentNotes.value = '';
}

function submitCount() {
  if (variance.value !== null && variance.value !== 0) {
    // Would call API here
  }
  handleClose();
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
      <div class="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-xl font-bold">Cycle Count</h2>
          <Button variant="ghost" size="sm" @click="handleClose">
            <XIcon class="w-4 h-4" />
          </Button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <div v-if="selectedProduct">
            <div class="space-y-4">
              <h3 class="font-medium">{{ selectedProduct.name }}</h3>
              <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p class="text-xs text-muted-foreground mb-1">Expected</p>
                  <p class="text-2xl font-bold">{{ expectedQty }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">Counted</p>
                  <input
                    type="number"
                    v-model.number="countedQty"
                    min="0"
                    class="w-20 h-8 text-center text-lg font-bold rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">Difference</p>
                  <p
                    class="text-2xl font-bold"
                    :class="variance === null ? 'text-muted-foreground' : variance >= 0 ? 'text-green-600' : 'text-red-600'"
                  >
                    <span v-if="variance !== null">{{ variance >= 0 ? '+' : '' }}{{ variance }}</span>
                    <span v-else>—</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <button
                v-for="product in filteredProducts.slice(0, 50)"
                :key="product.id"
                @click="selectedProduct = product; expectedQty = product.stockQuantity ?? 0; countedQty = null"
                class="w-full flex items-center gap-3 p-3 rounded border border-border hover:bg-muted/30 text-left"
              >
                <Package class="w-5 h-5 text-muted-foreground" />
                <span class="flex-1">{{ product.name }}</span>
                <span class="text-xs text-muted-foreground">{{ product.stockQuantity ?? 0 }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" @click="handleClose">
            Cancel
          </Button>
          <Button
            v-if="selectedProduct && variance !== 0"
            @click="submitCount"
          >
            <Check class="w-4 h-4 mr-2" />
            Save Count
          </Button>
        </div>
      </div>
    </div>
  </transition>
</template>
