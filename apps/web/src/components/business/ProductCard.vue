<script setup lang="ts">
import type { Product } from '@/shared/types';
import { computed } from 'vue';

const props = defineProps<{
  product: Product;
  showActions?: boolean;
}>();

const emit = defineEmits<{
  (e: 'view', id: string): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const stockStatus = computed(() => {
  const stock = props.product.stockQuantity ?? 0;
  if (stock === 0) return 'out';
  if (stock < (props.product.lowStockThreshold ?? 5)) return 'low';
  return 'good';
});
</script>

<template>
  <div
    class="card p-4 cursor-pointer hover:shadow-md transition-shadow group/card"
    @click="emit('view', product.id)"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="font-medium text-sm">{{ product.name }}</h3>
        <p class="text-xs text-gray-500 mt-1">{{ product.code }} / {{ product.sku }}</p>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-lg font-bold text-primary-600">
            KES {{ product.sellingPrice?.toLocaleString() }}
          </span>
          <span v-if="product.costPrice > 0" class="text-xs text-gray-400">
            cost: KES {{ product.costPrice?.toLocaleString() }}
          </span>
        </div>
      </div>

      <div v-if="showActions" class="flex gap-1 opacity-0 group/card:hover:opacity-100 transition-opacity">
        <button @click.stop="emit('edit', product.id)" class="p-1 hover:bg-gray-100 rounded">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.441-9.032l1-1m0 0l3-3m-3 3l-7.032 7.032a2 2 0 01-2.351-2.351l7.032-7.032z" />
          </svg>
        </button>
        <button @click.stop="emit('delete', product.id)" class="p-1 hover:bg-gray-100 rounded text-red-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.857L5 7m5 5v5m0 0l1-1m-1 1l-1-1M5 7h14" />
          </svg>
        </button>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between">
      <span class="text-xs text-gray-500">Stock: {{ product.stockQuantity ?? 0 }}</span>
      <span
        class="text-xs font-medium"
        :class="{
          'text-red-600': stockStatus === 'out',
          'text-orange-600': stockStatus === 'low',
          'text-green-600': stockStatus === 'good',
        }"
      >
        {{
          stockStatus === 'out' ? 'Out of stock' :
          stockStatus === 'low' ? 'Low stock' : 'In stock'
        }}
      </span>
    </div>
  </div>
</template>
