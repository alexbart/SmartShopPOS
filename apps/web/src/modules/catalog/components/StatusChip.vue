<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    status: 'active' | 'inactive' | 'draft' | 'pending' | string;
    text?: string;
    size?: 'sm' | 'md';
  }>(),
  { size: 'md' },
);

const statusClass = computed(() => {
  switch (props.status) {
    case 'active':
      return 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400';
    case 'inactive':
    case 'disabled':
      return 'bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400';
    case 'draft':
      return 'bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400';
    case 'pending':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
    case 'low':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
    case 'out':
      return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400';
    default:
      return 'bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400';
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full font-medium',
      statusClass,
      {
        'text-xs px-2 py-0.5': size === 'sm',
        'text-sm px-2.5 py-1': size === 'md',
      },
    ]"
  >
    <span
      :class="[
        'w-1.5 h-1.5 rounded-full mr-1.5',
        {
          'bg-green-500': status === 'active',
          'bg-gray-500': status === 'inactive',
          'bg-slate-500': status === 'draft',
          'bg-amber-500': status === 'pending',
          'bg-orange-500': status === 'low',
          'bg-red-500': status === 'out',
        },
      ]"
    />
    {{ text ?? status }}
  </span>
</template>
