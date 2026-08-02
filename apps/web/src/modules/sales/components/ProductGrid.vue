<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Product } from '@/shared/types';
import ProductTile from '@/modules/sales/components/ProductTile.vue';
import { Grid3X3, LayoutList, Package } from '@lucide/vue';
import { Button } from '@/components/ui/button';

const props = defineProps<{
  products: Product[];
  loading?: boolean;
  searchQuery?: string;
  selectedCategory?: string | null;
  pinnedIds?: string[];
}>();

const emit = defineEmits<{
  (e: 'select', product: Product): void;
  (e: 'pin', productId: string): void;
}>();

const viewMode = ref<'grid' | 'list'>('grid');
const searchQueryLower = computed(() => props.searchQuery?.toLowerCase() ?? '');

function matchesSearch(product: Product): boolean {
  if (!searchQueryLower.value) return true;
  return (
    product.name.toLowerCase().includes(searchQueryLower.value) ||
    (product.code || '').toLowerCase().includes(searchQueryLower.value) ||
    (product.sku || '').toLowerCase().includes(searchQueryLower.value) ||
    (product.barcode || '').toLowerCase().includes(searchQueryLower.value) ||
    (product.brandName || '').toLowerCase().includes(searchQueryLower.value) ||
    (product.categoryName || '').toLowerCase().includes(searchQueryLower.value)
  );
}

const filtered = computed(() => {
  let result = props.products.filter(matchesSearch);
  if (props.selectedCategory) {
    result = result.filter((p) => p.categoryId === props.selectedCategory);
  }
  return result;
});
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-medium">
        Products
        <span v-if="searchQuery" class="text-muted-foreground text-sm">
          — "{{ searchQuery }}"
        </span>
      </h2>
      <div class="flex items-center gap-2">
        <div
          v-if="searchQuery"
          class="text-sm text-muted-foreground"
        >
          {{ filtered.length }} found
        </div>
        <div class="flex border rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-muted': viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            class="touch-target"
          >
            <Grid3X3 class="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-muted': viewMode === 'list' }"
            @click="viewMode = 'list'"
            class="touch-target"
          >
            <LayoutList class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto"
    >
      <div v-for="i in 12" :key="i" class="animate-pulse">
        <div class="bg-muted rounded-lg aspect-square w-full mb-2"></div>
        <div class="h-3 bg-muted rounded w-3/4 mb-1"></div>
        <div class="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>

    <div
      v-else-if="filtered.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center py-12"
    >
      <Package class="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h3 class="text-lg font-medium text-muted-foreground">
        No products found
      </h3>
      <p class="text-sm text-muted-foreground/70 mt-1">
        Try adjusting your search
      </p>
    </div>

    <div
      v-else
      :class="[
        'overflow-y-auto',
        viewMode === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
          : 'space-y-1',
      ]"
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
  </div>
</template>

<style scoped>
.view-enter-active,
.view-leave-active {
  transition: all 0.2s ease-in-out;
}
.view-enter-from,
.view-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
