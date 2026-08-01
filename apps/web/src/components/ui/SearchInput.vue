<script setup lang="ts">
import { computed } from 'vue';
import { useNotificationStore } from '@/stores/notification';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    type?: string;
    debounce?: number;
    clearable?: boolean;
  }>(),
  { placeholder: '', type: 'text', debounce: 0, clearable: false },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'clear'): void;
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();

const internalValue = ref(props.modelValue ?? '');
const isFocused = ref(false);
const isFocusedDebounced = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    if (val !== internalValue.value) {
      internalValue.value = val ?? '';
    }
  },
);

watch(internalValue, (val) => {
  if (val !== props.modelValue) {
    if (props.debounce > 0) {
      if (isFocused.value) {
        emit('update:modelValue', val);
      } else {
        debounceSearch(val);
      }
    } else {
      emit('update:modelValue', val);
    }
  }
});

let debounceTimeout: NodeJS.Timeout | null = null;
function debounceSearch(value: string) {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    emit('update:modelValue', value);
  }, props.debounce);
}

function onClear() {
  internalValue.value = '';
  emit('clear');
}

function onFocus() {
  isFocused.value = true;
  emit('focus');
}

function onBlur() {
  isFocused.value = false;
  emit('blur');
}
</script>

<template>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <input
      :type="type"
      v-model="internalValue"
      :placeholder="placeholder"
      @focus="onFocus"
      @blur="onBlur"
      :class="[
        'pl-10 pr-4 py-2 w-full border rounded-lg bg-white text-sm transition-colors',
        isFocused ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-300',
      ]"
    />
    <button
      v-if="clearable && internalValue"
      @click="onClear"
      class="absolute inset-y-0 right-0 pr-3 flex items-center"
    >
      <svg class="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.input-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
.input-md {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
.input-lg {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}
</style>
