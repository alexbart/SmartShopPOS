<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    quantity: number;
    threshold?: number;
    warehouse: string;
    incoming?: number;
    size?: 'sm' | 'md';
  }>(),
  { threshold: 0, incoming: 0, size: 'sm' },
);

const stockStatus = computed(() => {
  if (props.incoming > 0 && props.quantity === 0) return 'incoming';
  if (props.incoming > 0) return 'partial-incoming';
  if (props.quantity === 0) return 'out';
  if (props.quantity <= props.threshold) return 'low';
  return 'good';
});

const statusClass = computed(() => {
  switch (stockStatus.value) {
    case 'out':
      return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400';
    case 'low':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
    case 'good':
      return 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400';
    case 'incoming':
    case 'partial-incoming':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
    default:
      return 'bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400';
  }
});
</script>

<template>
  <div
    :class="[
      'inline-flex items-center gap-2 rounded-full font-medium transition-all',
      statusClass,
      {
        'text-xs px-2 py-0.5': size === 'sm',
        'text-sm px-3 py-1': size === 'md',
      },
    ]"
  >
    <span
      :class="[
        'rounded-full flex-shrink-0',
        {
          'w-1.5 h-1.5 bg-red-500': stockStatus === 'out',
          'w-1.5 h-1.5 bg-orange-400': stockStatus === 'low',
          'w-1.5 h-1.5 bg-green-500': stockStatus === 'good',
          'w-1.5 h-1.5 bg-blue-500': ['incoming', 'partial-incoming'].includes(stockStatus),
        },
      ]"
    />
    <span>{{ warehouse }}</span>
    <span class="font-medium">{{ quantity }}</span>
    <span
      v-if="incoming > 0"
      class="text-xs text-blue-600 dark:text-blue-400"
    >
      +{{ incoming }} incoming
    </span>
  </div>
</template>
