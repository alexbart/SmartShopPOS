<script setup lang="ts">
defineProps<{
  status: 'active' | 'inactive' | 'draft' | 'pending' | string;
  text?: string;
}>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      status === 'active' && 'bg-success/10 text-success',
      status === 'inactive' && 'bg-muted/30 text-muted-foreground',
      status === 'draft' && 'bg-muted/30 text-muted-foreground',
      status === 'pending' && 'bg-warning/10 text-warning',
      status === 'approved' && 'bg-success/10 text-success',
      status === 'rejected' && 'bg-destructive/10 text-destructive',
      status === 'cancelled' && 'bg-destructive/10 text-destructive',
    ]"
  >
    {{ text ?? status }}
  </span>
</template>
