<script setup lang="ts">
defineProps<{
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  dismissible?: boolean;
}>();

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();
</script>

<template>
  <div
    :class="[
      'p-4 rounded-lg border flex items-start gap-3',
      {
        'bg-green-50 border-green-200': type === 'success',
        'bg-red-50 border-red-200': type === 'error',
        'bg-amber-50 border-amber-200': type === 'warning',
        'bg-blue-50 border-blue-200': type === 'info',
      },
    ]"
  >
    <div class="flex-1">
      <p class="font-medium">{{ title }}</p>
      <p v-if="description" class="text-sm mt-1">{{ description }}</p>
    </div>
    <button
      v-if="dismissible"
      @click="emit('dismiss')"
      class="flex-shrink-0 text-gray-400 hover:text-gray-600"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
