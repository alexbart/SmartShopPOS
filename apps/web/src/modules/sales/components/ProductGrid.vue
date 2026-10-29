<script setup lang="ts">
import { computed } from 'vue';
import type { Product } from '@/shared/types';
import ProductTile from '@/modules/sales/components/ProductTile.vue';
import { Package } from '@lucide/vue';

const props = defineProps<{
  products: Product[];
  loading?: boolean;
  searchQuery?: string;
  selectedCategory?: string | null;
  pinnedIds?: string[];
  viewMode?: 'grid' | 'list';
}>();

const emit = defineEmits<{
  (e: 'select', product: Product): void;
  (e: 'pin', productId: string): void;
}>();

const filtered = computed(() => {
  let result = props.products;
  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
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
  if (props.selectedCategory) {
    result = result.filter((p) => p.categoryId === props.selectedCategory);
  }
  return result;
});
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Skeleton -->
    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
    >
      <div v-for="i in 15" :key="i" class="animate-pulse">
        <div class="bg-muted rounded-lg aspect-square w-full mb-2" />
        <div class="h-3 bg-muted rounded w-3/4 mb-1" />
        <div class="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filtered.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center py-16"
    >
      <Package class="w-16 h-16 text-muted-foreground/20 mb-4" />
      <h3 class="text-base font-medium text-muted-foreground">
        {{ searchQuery ? `No results for "${searchQuery}"` : 'No products in this category' }}
      </h3>
      <p class="text-sm text-muted-foreground/60 mt-1">
        {{ searchQuery ? 'Try a different search term or scan a barcode' : 'Select a different category or search above' }}
      </p>
    </div>

    <!-- Grid -->
    <div
      v-else-if="viewMode !== 'list'"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
    >
      <ProductTile
        v-for="product in filtered"
        :key="product.id"
        :product="product"
        :pinned="props.pinnedIds?.includes(product.id)"
        @select="$emit('select', $event)"
        @pin="$emit('pin', $event)"
      />
    </div>

    <!-- List -->
    <div v-else class="space-y-1">
      <button
        v-for="product in filtered"
        :key="product.id"
        :disabled="(product.stockQuantity ?? 0) <= 0"
        @click="$emit('select', product)"
        :class="[
          'w-full flex items-center gap-3 p-3 rounded-lg border bg-card text-left transition-all',
          (product.stockQuantity ?? 0) <= 0
            ? 'opacity-60 cursor-not-allowed border-border'
            : 'hover:shadow-md hover:border-primary cursor-pointer border-border',
        ]"
      >
        <div class="flex-1">
          <p class="font-medium text-sm">{{ product.name }}</p>
          <p class="text-xs text-muted-foreground/70 font-mono">{{ product.code || product.sku || '—' }}</p>
        </div>
        <div class="text-right">
          <p class="text-base font-bold text-primary">KES {{ product.sellingPrice.toLocaleString() }}</p>
          <p class="text-xs" :class="(product.stockQuantity ?? 0) <= 0 ? 'text-amber-500 font-medium' : 'text-muted-foreground'">
            {{ (product.stockQuantity ?? 0) <= 0 ? 'Out of stock' : `Stock: ${product.stockQuantity}` }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
