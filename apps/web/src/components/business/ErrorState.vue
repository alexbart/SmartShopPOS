<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
  retryable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'retry'): void;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <svg class="w-12 h-12 text-destructive mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 8.25v3.147a.5.5 0 001.001-.098V8.25a.75.75 0 10-1.5 0zm0 5.195v3.195a.75.75 0 001.5 0v-3.195a.75.75 0 111.5 0v.705a2.25 2.25 0 01-2.25 2.25H10.5a2.25 2.25 0 01-2.25-2.25v-1.455a.75.75 0 111.5 0z" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none" />
    </svg>
    <p class="font-medium text-lg">{{ title ?? 'Something went wrong' }}</p>
    <p v-if="description" class="text-sm text-muted-foreground/70 mt-1">{{ description }}</p>
    <button
      v-if="retryable"
      @click="emit('retry')"
      class="mt-4 btn btn-outline btn-sm"
    >
      Retry
    </button>
  </div>
</template>
