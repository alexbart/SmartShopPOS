<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Search, X } from '@lucide/vue';
import { useDebounceFn } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    debounce?: number;
  }>(),
  { placeholder: 'Search...', debounce: 300 },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'search', v: string): void;
}>();

const localValue = ref(props.modelValue);
const inputRef = ref<HTMLInputElement | null>(null);

const debouncedSearch = useDebounceFn((val: string) => {
  emit('search', val);
}, props.debounce);

watch(
  () => props.modelValue,
  (v) => {
    localValue.value = v;
  },
);

watch(localValue, (v) => {
  emit('update:modelValue', v);
  debouncedSearch(v);
});

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      inputRef.value?.focus();
    }
  };
  document.addEventListener('keydown', handler);
  onUnmounted(() => document.removeEventListener('keydown', handler));
});

function clear() {
  localValue.value = '';
  emit('update:modelValue', '');
  emit('search', '');
}
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <input
      ref="inputRef"
      v-model="localValue"
      type="search"
      :placeholder="`${placeholder} (⌘K)`"
      class="w-full pl-10 pr-8 h-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
    <button
      v-if="localValue"
      @click="clear"
      class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="Clear search"
    >
      <X class="w-3 h-3" />
    </button>
  </div>
</template>
