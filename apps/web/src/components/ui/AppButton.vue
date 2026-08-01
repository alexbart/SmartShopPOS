<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  block?: boolean;
  type?: string;
}>();

const emit = defineEmits<{
  (e: 'click', e: MouseEvent): void;
}>();
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none',
      'focus:ring-2 focus:ring-offset-2',
      {
        'opacity-50 cursor-not-allowed': disabled || loading,
        'w-full': block,
        btn: true,
        'btn-primary': variant === 'primary',
        'btn-secondary': variant === 'secondary',
        'btn-ghost': variant === 'ghost',
        'btn-outline': variant === 'outline',
        'btn-sm': size === 'sm',
        'btn-lg': size === 'lg',
      },
    ]"
    @click="emit('click', $event as any)"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
      </path>
    </svg>
    <slot />
  </button>
</template>
