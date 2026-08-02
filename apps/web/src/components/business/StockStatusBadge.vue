<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    currentStock: number;
    lowStockThreshold?: number;
    size?: 'sm' | 'md';
    showText?: boolean;
  }>(),
  { size: 'md', showText: true }
);

const status = computed(() => {
  const stock = props.currentStock ?? 0;
  const threshold = props.lowStockThreshold ?? 0;
  if (stock === 0) return 'out';
  if (stock <= threshold) return 'low';
  return 'good';
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
      {
        'bg-red-50 text-red-700': status === 'out',
        'bg-orange-50 text-orange-700': status === 'low',
        'bg-green-50 text-green-700': status === 'good',
        'text-sm px-2.5 py-0.5': props.size === 'sm',
        'text-base px-3 py-1': props.size === 'md',
      },
    ]"
  >
    <span
      :class="[
        'rounded-full',
        {
          'w-1.5 h-1.5 bg-red-500': status === 'out',
          'w-1.5 h-1.5 bg-orange-400': status === 'low',
          'w-1.5 h-1.5 bg-green-500': status === 'good',
        },
      ]"
    />
    <span v-if="props.showText">
      <template v-if="status === 'out'">Out of stock</template>
      <template v-else-if="status === 'low'">Low stock</template>
      <template v-else>
        {{ props.currentStock }} in stock
      </template>
    </span>
  </span>
</template>
