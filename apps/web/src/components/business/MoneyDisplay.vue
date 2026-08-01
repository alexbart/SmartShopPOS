<script setup lang="ts">
defineProps<{
  amount: number | string;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  prefix?: string;
}>();
</script>

<template>
  <span :class="{
    'text-xs': size === 'sm',
    'text-sm': size === 'md',
    'text-base': size === 'lg',
    'font-medium': true,
  }">
    {{ prefix ?? (currency ?? 'KES') }} {{ Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) }}
  </span>
</template>
