<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    quantity: number;
    threshold?: number;
    incoming?: number;
    size?: 'sm' | 'md';
    showText?: boolean;
  }>(),
  { threshold: 0, incoming: 0, size: 'md', showText: true },
);

const status = computed((): string => {
  if (props.incoming > 0 && props.quantity === 0) return 'incoming';
  if (props.incoming > 0) return 'partial-incoming';
  if (props.quantity === 0) return 'out';
  if (props.quantity <= props.threshold) return 'low';
  return 'good';
});

const displayText = computed(() => {
  switch (status.value) {
    case 'out':
      return 'Out of stock';
    case 'low':
      return `${props.quantity} left`;
    case 'incoming':
      return `${props.incoming} incoming`;
    case 'partial-incoming':
      return `${props.quantity} + ${props.incoming} incoming`;
    default:
      return `${props.quantity} in stock`;
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
      {
        'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400': status === 'out',
        'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400': status === 'low',
        'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400': status === 'good',
        'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400': ['incoming', 'partial-incoming'].includes(status),
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
          'w-1.5 h-1.5 bg-blue-500': ['incoming', 'partial-incoming'].includes(status),
        },
      ]"
    />
    <span v-if="showText && props.incoming > 0 && status !== 'incoming'" class="text-xs font-medium">
      {{ displayText }}
    </span>
    <span v-else-if="showText">
      {{ displayText }}
    </span>
  </span>
</template>
