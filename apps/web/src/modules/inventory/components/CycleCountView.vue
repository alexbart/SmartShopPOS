<script setup lang="ts">
import { ref, computed } from 'vue';
import { Package, RefreshCw, Check, X as XIcon } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/shared/types';

const props = withDefaults(
  defineProps<{
    products: Product[];
  }>(),
  {
    products: () => [],
  },
);

const selectedCategory = ref<string | null>(null);
const expectedQty = ref<number | null>(null);
const countedQty = ref<number | null>(null);
const variance = computed(() => {
  if (expectedQty.value === null || countedQty.value === null) return null;
  return countedQty.value - expectedQty.value;
});

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
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-3 flex-wrap">
      <select
        v-model="selectedCategory"
        class="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div class="text-sm text-muted-foreground">
      {{ filteredProducts.length }} products in selected category
    </div>

    <div v-if="selectedProduct" class="space-y-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium">{{ selectedProduct.name }}</h3>
            <Button variant="ghost" size="sm" @click="selectedProduct = null">
              Change
            </Button>
          </div>

          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-xs text-muted-foreground mb-1">Expected</p>
              <Badge variant="outline" class="text-lg">
                {{ expectedQty ?? (selectedProduct.stockQuantity ?? 0) }}
              </Badge>
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
              <Badge
                :variant="variance === null ? 'outline' : variance >= 0 ? 'default' : 'destructive'"
                class="text-lg"
              >
                <span v-if="variance !== null">{{ variance >= 0 ? '+' : '' }}{{ variance }}</span>
                <span v-else>—</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <h3 class="font-medium mb-3">Reason for Difference</h3>
          <select
            class="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option>Select a reason...</option>
            <option>Broken / Damaged</option>
            <option>Expired</option>
            <option>Theft</option>
            <option>Miscount (error)</option>
            <option>Other</option>
          </select>
        </CardContent>
      </Card>

      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="selectedProduct = null">
          Cancel
        </Button>
        <Button :disabled="variance === null || variance === 0">
          <Check class="w-4 h-4 mr-2" />
          Submit Count
        </Button>
      </div>
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="product in filteredProducts.slice(0, 50)"
        :key="product.id"
        @click="selectedProduct = product; expectedQty = product.stockQuantity ?? 0; countedQty = null"
        class="w-full flex items-center gap-3 p-3 rounded border border-border hover:bg-muted/30 text-left"
      >
        <Package class="w-5 h-5 text-muted-foreground" />
        <div class="flex-1">
          <p class="font-medium">{{ product.name }}</p>
          <p class="text-xs text-muted-foreground">
            SKU: {{ product.sku }} · Category: {{ product.categoryName }}
          </p>
        </div>
        <Badge
          :variant="
            (product.stockQuantity ?? 0) === 0
              ? 'destructive'
              : (product.stockQuantity ?? 0) <= (product.lowStockThreshold ?? 0)
                ? 'secondary'
                : 'default'
          "
        >
          {{ product.stockQuantity ?? 0 }}
        </Badge>
      </button>
      <div
        v-if="filteredProducts.length === 0"
        class="text-center py-8 text-muted-foreground"
      >
        <Package class="h-8 w-8 mx-auto mb-2 opacity-20" />
        <p>No products match your filters</p>
      </div>
    </div>
  </div>
</template>
