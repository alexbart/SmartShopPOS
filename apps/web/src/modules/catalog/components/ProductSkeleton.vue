<script setup lang="ts">
defineProps<{
  rows?: number;
}>();
</script>

<template>
  <div class="space-y-3">
    <div v-for="i in (rows || 5)" :key="i" class="flex items-center gap-3">
      <div class="w-12 h-12 bg-muted rounded-md animate-pulse flex-shrink-0"></div>
      <div class="flex-1 space-y-1">
        <div class="h-4 bg-muted rounded animate-pulse w-3/4"></div>
        <div class="h-3 bg-muted rounded animate-pulse w-1/2"></div>
        <div class="h-3 bg-muted rounded animate-pulse w-1/4"></div>
      </div>
      <div class="h-8 w-8 bg-muted rounded animate-pulse flex-shrink-0"></div>
    </div>
  </div>
</template>
