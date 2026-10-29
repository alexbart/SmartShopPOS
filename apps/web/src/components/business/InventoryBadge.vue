<script setup lang="ts">
defineProps<{
  currentStock: number;
  lowStockThreshold?: number;
  size?: 'sm' | 'md';
}>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      {
        'bg-red-100 text-red-800': currentStock === 0,
        'bg-orange-100 text-orange-800': currentStock <= (lowStockThreshold ?? 0),
        'bg-green-100 text-green-800': currentStock > (lowStockThreshold ?? 0),
      },
    ]"
  >
    {{ currentStock }} in stock
  </span>
</template>
