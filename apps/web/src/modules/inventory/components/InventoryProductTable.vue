<script setup lang="ts">
import { ref, computed } from 'vue';
import { Package, TrendingUp, TrendingDown, ChevronUp, ChevronDown, X } from '@lucide/vue';
import { Button } from '@/components/ui/button';

interface ProductWithStock {
  id: string;
  name: string;
  code: string;
  sku: string | null;
  sellingPrice: number;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  categoryName?: string;
  brandName?: string;
}

const props = withDefaults(
  defineProps<{
    products: ProductWithStock[];
    loading?: boolean;
    showStockColumns?: boolean;
    selectedProducts: Set<string>;
  }>(),
  {
    products: () => [],
    loading: false,
    showStockColumns: false,
  },
);

const emit = defineEmits<{
  (e: 'update:selected', value: Set<string>): void;
}>();

const selectAll = ref(false);
const sortKey = ref<'name' | 'stockQuantity' | 'sellingPrice'>('name');
const sortDir = ref<'asc' | 'desc'>('asc');

const sortedProducts = computed(() => {
  const result = [...props.products];
  result.sort((a, b) => {
    const aVal = a[sortKey.value];
    const bVal = b[sortKey.value];
    if (sortKey.value === 'name') {
      return aVal === bVal ? 0 : aVal < bVal ? -1 : 1;
    }
    if (aVal !== bVal) {
      return aVal - bVal;
    }
    return a.name.localeCompare(b.name);
  });
  if (sortDir.value === 'desc') result.reverse();
  return result;
});

function toggleSort(key: 'name' | 'stockQuantity' | 'sellingPrice') {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}

function handleSelectAll() {
  if (selectAll.value) {
    props.selectedProducts.clear();
  } else {
    for (const p of props.products) {
      props.selectedProducts.add(p.id);
    }
  }
  selectAll.value = !selectAll.value;
  emit('update:selected', props.selectedProducts);
}

function toggleProduct(id: string) {
  if (props.selectedProducts.has(id)) {
    props.selectedProducts.delete(id);
  } else {
    props.selectedProducts.add(id);
  }
  emit('update:selected', props.selectedProducts);
}

function getStockStatus(qty: number, lowStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (qty === 0) return 'out_of_stock';
  if (qty <= lowStock) return 'low_stock';
  return 'in_stock';
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="loading"
      class="space-y-2"
    >
      <div v-for="i in 8" :key="i" class="h-12 bg-muted/30 rounded animate-pulse"></div>
    </div>

    <div v-else>
      <div class="border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/30 border-b">
              <tr>
                <th class="w-8 h-10 text-center">
                  <input
                    type="checkbox"
                    :checked="selectAll"
                    @change="handleSelectAll"
                    class="rounded border-border"
                  />
                </th>
                <th
                  v-for="h in ['Product', 'SKU', 'Category', 'Price', 'Stock', 'Reserved', 'Status']"
                  :key="h"
                  class="h-10 px-3 text-left font-medium text-muted-foreground"
                >
                  <button
                    v-if="h === 'Product'"
                    @click="toggleSort('name')"
                    class="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {{ h }}
                    <component
                      :is="sortDir === 'asc' ? ChevronUp : ChevronDown"
                      v-if="sortKey === 'name'"
                      class="w-3 h-3"
                    />
                  </button>
                  <button
                    v-else-if="h === 'Stock'"
                    @click="toggleSort('stockQuantity')"
                    class="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {{ h }}
                    <component
                      :is="sortDir === 'asc' ? ChevronUp : ChevronDown"
                      v-if="sortKey === 'stockQuantity'"
                      class="w-3 h-3"
                    />
                  </button>
                  <button
                    v-else-if="h === 'Price'"
                    @click="toggleSort('sellingPrice')"
                    class="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {{ h }}
                    <component
                      :is="sortDir === 'asc' ? ChevronUp : ChevronDown"
                      v-if="sortKey === 'sellingPrice'"
                      class="w-3 h-3"
                    />
                  </button>
                  <span v-else>{{ h }}</span>
                </th>
                <th v-if="!showStockColumns" class="h-10 px-3 text-left font-medium text-muted-foreground">
                  Available
                </th>
                <th class="h-10 w-16"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in sortedProducts"
                :key="product.id"
                class="border-b hover:bg-muted/20 transition-colors"
              >
                <td class="h-12 px-3">
                  <input
                    type="checkbox"
                    :checked="selectedProducts.has(product.id)"
                    @change="toggleProduct(product.id)"
                    class="rounded border-border"
                  />
                </td>
                <td class="h-12">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded bg-muted/30 flex items-center justify-center">
                      <Package class="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p class="font-medium">{{ product.name }}</p>
                      <p v-if="showStockColumns && product.brandName" class="text-xs text-muted-foreground">
                        {{ product.brandName }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="h-12 text-muted-foreground">{{ product.code }}</td>
                <td class="h-12 text-muted-foreground">{{ product.categoryName || '-' }}</td>
                <td class="h-12">KES {{ product.sellingPrice.toLocaleString() }}</td>
                <td class="h-12">
                  <span
                    :class="{
                      'text-green-600': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'in_stock',
                      'text-orange-600': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'low_stock',
                      'text-red-600': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'out_of_stock',
                    }"
                    class="font-medium"
                  >
                    {{ product.stockQuantity }}
                    <span v-if="product.reservedQuantity > 0" class="text-xs text-muted-foreground">
                      ({{ product.reservedQuantity }} reserved)
                    </span>
                  </span>
                </td>
                <td v-if="showStockColumns" class="h-12">{{ product.lowStockThreshold }}</td>
                <td v-if="!showStockColumns" class="h-12">
                  {{ product.stockQuantity - product.reservedQuantity }}
                </td>
                <td class="h-12">
                  <span
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'in_stock',
                      'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'low_stock',
                      'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'out_of_stock',
                    }"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="{
                        'bg-green-500': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'in_stock',
                        'bg-orange-500': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'low_stock',
                        'bg-red-500': getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'out_of_stock',
                      }"
                    ></span>
                    <span v-if="getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'in_stock'">In Stock</span>
                    <span v-else-if="getStockStatus(product.stockQuantity, product.lowStockThreshold) === 'low_stock'">Low</span>
                    <span v-else>Out</span>
                  </span>
                </td>
                <td class="h-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="toggleProduct(product.id)"
                    class="h-6 w-6 p-0"
                  >
                    <X class="w-3 h-3" v-if="selectedProducts.has(product.id)" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="!sortedProducts.length && !loading"
        class="text-center py-12 text-muted-foreground"
      >
        <Package class="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p class="font-medium">No products found</p>
        <p class="text-sm mt-1">Try adjusting your filters</p>
      </div>
    </div>
  </div>
</template>
