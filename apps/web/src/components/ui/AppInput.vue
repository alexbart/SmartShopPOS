<script setup lang="ts">
defineProps<{
  label: string;
  modelValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :type="type ?? 'text'"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="placeholder"
      :class="[
        'w-full px-3 py-2 border rounded-lg bg-input text-input transition-colors',
        error ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-primary',
      ]"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
