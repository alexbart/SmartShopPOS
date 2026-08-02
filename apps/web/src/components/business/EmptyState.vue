<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
  icon?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <div v-if="icon" class="text-6xl opacity-20 mb-4">
      <component :is="icon" />
    </div>
    <svg v-else class="w-12 h-12 text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10a2 2 0 01-2 2h-2.5m-9.5 0a2 2 0 01-2-2V7" />
    </svg>
    <p class="text-lg font-medium text-muted-foreground mb-1">{{ title ?? 'No data found' }}</p>
    <p v-if="description" class="text-sm text-muted-foreground/70">{{ description }}</p>
  </div>
</template>
