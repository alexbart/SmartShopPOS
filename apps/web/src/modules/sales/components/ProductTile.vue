<script setup lang="ts">
import { computed } from 'vue';
import type { Product } from '@/shared/types';
import ProductAvatar from '@/modules/catalog/components/ProductAvatar.vue';
import StockBadge from '@/modules/catalog/components/StockBadge.vue';
import { Star, AlertTriangle } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    product: Product;
    pinned?: boolean;
  }>(),
  { pinned: false },
);

const emit = defineEmits<{
  (e: 'select', product: Product): void;
  (e: 'pin', productId: string): void;
}>();

const isOutOfStock = computed(() => (props.product.stockQuantity ?? 0) <= 0);

function handlePin(event: MouseEvent) {
  event.stopPropagation();
  emit('pin', props.product.id);
}

const displayPrice = (price: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(price);
};
</script>

<template>
  <button
    @click="!isOutOfStock && $emit('select', product)"
    :disabled="isOutOfStock"
    :class="[
      'relative flex flex-col items-center p-2 rounded-lg border bg-card transition-all duration-150 touch-target w-full group',
      isOutOfStock
        ? 'border-border opacity-60 cursor-not-allowed'
        : 'border-border hover:shadow-md hover:border-primary cursor-pointer',
    ]"
  >
    <Star
      v-if="props.pinned"
      class="absolute top-1 right-1 w-3 h-3 text-amber-400 fill-current"
    />
    <button
      v-else
      @click.stop="handlePin"
      class="absolute top-1 right-1 w-5 h-5 rounded-full bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity touch-target flex items-center justify-center"
    >
      <Star class="w-3 h-3 text-muted-foreground" />
    </button>

    <div class="relative mb-1">
      <ProductAvatar :src="product.imageUrl" :alt="product.name" size="md" />
      <StockBadge
        v-if="product.stockQuantity !== undefined"
        :quantity="product.stockQuantity"
        :threshold="product.lowStockThreshold"
        size="sm"
        :show-text="false"
        class="absolute -top-1 -right-1"
      />
    </div>

    <p class="text-sm font-medium text-center leading-tight mb-0.5 truncate w-full" :title="product.name">
      {{ product.name }}
    </p>
    <p class="text-lg font-bold text-primary mt-1">
      {{ displayPrice(product.sellingPrice) }}
    </p>

    <!-- Out of stock overlay label -->
    <div v-if="isOutOfStock" class="flex items-center gap-1 mt-0.5">
      <AlertTriangle class="w-3 h-3 text-amber-500" />
      <span class="text-xs text-amber-600 font-medium">Out of Stock</span>
    </div>
  </button>
</template>
