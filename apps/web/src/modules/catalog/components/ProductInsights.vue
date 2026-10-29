<script setup lang="ts">
import { Package, ShoppingCart, Receipt, DollarSign } from '@lucide/vue';
import type { Product } from '@/shared/types';

const props = defineProps<{
  product: Product;
}>();

const todaySales = 12540;
const weekUnits = 42;
const daysUntilOut = 18;
const lastPurchased = '2026-07-12';

const insights = [
  { label: "Today's Sales", value: `KES ${todaySales.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
  { label: 'This Week', value: `${weekUnits} Units`, icon: ShoppingCart, color: 'text-blue-600' },
  { label: 'Current Stock', value: `${props.product.stockQuantity ?? 0} units`, icon: Package, color: 'text-amber-600' },
  { label: 'Days Until Out', value: `${daysUntilOut} days`, icon: Package, color: 'text-red-600' },
  { label: 'Last Purchased', value: lastPurchased, icon: Receipt, color: 'text-purple-600' },
];
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
    <div
      v-for="item in insights"
      :key="item.label"
      class="flex items-center gap-3 p-3 rounded-lg border border-border"
    >
      <div class="p-2 rounded-lg bg-muted/30">
        <component
          :is="item.icon"
          class="w-4 h-4"
          :class="item.color"
        />
      </div>
      <div class="flex-1">
        <p class="text-xs text-muted-foreground">
          {{ item.label }}
        </p>
        <p class="font-medium text-sm">
          {{ item.value }}
        </p>
      </div>
    </div>
  </div>
</template>
