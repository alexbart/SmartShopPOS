<script setup lang="ts">
defineProps<{
  rows?: number;
  columns?: number;
}>();
</script>

<template>
  <div class="space-y-3">
    <div v-for="i in rows" :key="i" class="flex gap-2">
      <div v-for="j in columns" :key="j" class="h-4 bg-muted rounded animate-pulse flex-1"></div>
    </div>
  </div>
</template>
