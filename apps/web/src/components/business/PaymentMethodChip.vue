<script setup lang="ts">
defineProps<{
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}>();

const colors = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      colors[variant] || colors.neutral,
      { 'text-xs': size === 'sm', 'text-sm': size === 'md' },
    ]"
  >
    <slot />
  </span>
</template>
