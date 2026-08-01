<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label?: string;
    modelValue?: string;
    placeholder?: string;
    options?: Array<{ value: string; label: string; disabled?: boolean }>;
    error?: string;
    required?: boolean;
  }>(),
  { label: '', placeholder: '' },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const open = ref(false);
const selectedLabel = computed(() => {
  if (!props.modelValue) return props.placeholder;
  return props.options?.find((o) => o.value === props.modelValue)?.label ?? props.placeholder;
});
</script>

<template>
  <div class="relative mb-4">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div
      @click="open = !open"
      class="w-full px-3 py-2 border border-border rounded-lg bg-input text-input cursor-pointer flex items-center justify-between"
    >
      <span class="truncate">{{ selectedLabel || placeholder }}</span>
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <button
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
          @click="emit('update:modelValue', option.value); open = false"
          class="w-full px-3 py-2 text-left hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ option.label }}
        </button>
      </div>
    </transition>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
