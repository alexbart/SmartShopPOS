<script setup lang="ts">
import type { Product } from '@/shared/types';
import ProductAvatar from '@/modules/catalog/components/ProductAvatar.vue';
import StockBadge from '@/modules/catalog/components/StockBadge.vue';
import { Star } from '@lucide/vue';

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
    @click="$emit('select', product)"
    class="relative flex flex-col items-center p-2 rounded-lg border border-border bg-card hover:shadow-md hover:border-primary transition-all duration-150 touch-target w-full group"
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
      <ProductAvatar
        :src="product.imageUrl"
        :alt="product.name"
        size="md"
      />
      <StockBadge
        v-if="product.stockQuantity !== undefined"
        :quantity="product.stockQuantity"
        :threshold="product.lowStockThreshold"
        size="sm"
        :show-text="false"
        class="absolute -top-1 -right-1"
      />
    </div>

    <p
      class="text-sm font-medium text-center leading-tight mb-0.5 truncate w-full"
      :title="product.name"
    >
      {{ product.name }}
    </p>
    <p
      v-if="product.description"
      class="text-xs text-muted-foreground/70 text-center truncate w-full"
    >
      {{ product.description.substring(0, 30) }}
    </p>
    <p class="text-lg font-bold text-primary mt-1">
      {{ displayPrice(product.sellingPrice) }}
    </p>
  </button>
</template>
