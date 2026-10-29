<script setup lang="ts">
defineProps<{
  variant: 'primary' | 'secondary' | 'warning' | 'success' | 'danger';
}>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      {
        'bg-primary/10 text-primary': variant === 'primary',
        'bg-gray-100 text-gray-800': variant === 'secondary',
        'bg-amber-100 text-amber-800': variant === 'warning',
        'bg-green-100 text-green-800': variant === 'success',
        'bg-red-100 text-red-800': variant === 'danger',
      },
    ]"
  >
    <slot />
  </span>
</template>
