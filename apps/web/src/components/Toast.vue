<script setup lang="ts">
import { useNotification } from '@/stores/notification';

export interface ToastOptions {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

const { toasts, dismiss } = useNotification();
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="group/card p-4 rounded-lg shadow-lg border text-sm animate-in slide-in-from-bottom-2"
      :class="{
        'bg-green-50 border-green-200 text-green-800': toast.type === 'success',
        'bg-red-50 border-red-200 text-red-800': toast.type === 'error',
        'bg-amber-50 border-amber-200 text-amber-800': toast.type === 'warning',
        'bg-blue-50 border-blue-200 text-blue-800': toast.type === 'info',
      }"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <svg v-if="toast.type === 'success'" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor"
            viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5 13l4 4L19 7" /></svg>
          <svg v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor"
            viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 18L18 6M6 6l12 12" /></svg>
          <svg v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor"
            viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v4m0 4h.01m-6.97.412A2 2 0 019.87 18h4.26a2 2 0 001.85-1.81l1.74-7a2 2 0 00-1.9-2.34L7.36 5.14" /></svg>
          <svg v-else class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m0-4h.01M12 11c-.28 0-.5.22-.5.5v1a.5.5 0 001 0 .5.5 0 00-.5-.5zm0-3a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-semibold">{{ toast.title }}</p>
          <p v-if="toast.message" class="mt-0.5">{{ toast.message }}</p>
        </div>
        <button @click="dismiss(toast.id)"
          class="flex-shrink-0 opacity-0 group/card:hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
