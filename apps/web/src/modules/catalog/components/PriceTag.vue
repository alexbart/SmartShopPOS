<script setup lang="ts">
import { computed } from 'vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';

const props = withDefaults(
  defineProps<{
    amount: number | string;
    currency?: string;
    variant?: 'default' | 'sale' | 'cost';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
  }>(),
  { variant: 'default', size: 'md', showLabel: false },
);

const textColor = computed(() => {
  if (props.variant === 'sale') return 'text-blue-700 dark:text-blue-400';
  if (props.variant === 'cost') return 'text-muted-foreground';
  return 'text-foreground';
});
</script>

<template>
  <div :class="['flex items-center gap-1', textColor]">
    <span
      :class="{
        'text-xs': size === 'sm',
        'text-sm': size === 'md',
        'text-lg': size === 'lg',
        'font-medium': true,
      }"
    >
      <MoneyDisplay
        :amount="amount"
        :currency="currency"
        :size="size"
      />
    </span>
    <span
      v-if="variant === 'sale'"
      class="text-xs font-medium text-blue-600 dark:text-blue-400"
    >
      SALE
    </span>
  </div>
</template>
