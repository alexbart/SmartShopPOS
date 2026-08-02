<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search, X, Filter, Download } from '@lucide/vue';
import { useDebounceFn } from '@vueuse/core';
import { Button } from '@/components/ui/button';

const props = withDefaults(
  defineProps<{
    search: string;
    placeholder?: string;
    debounce?: number;
    showFilters?: boolean;
    showExport?: boolean;
  }>(),
  { placeholder: 'Search products...', debounce: 300, showFilters: true, showExport: true },
);

const emit = defineEmits<{
  (e: 'update:search', v: string): void;
  (e: 'search', v: string): void;
  (e: 'open-filters'): void;
  (e: 'export'): void;
  (e: 'clear-all'): void;
}>();

const localValue = ref(props.search);
const inputRef = ref<HTMLInputElement | null>(null);

const debouncedSearch = useDebounceFn((val: string) => {
  emit('search', val);
}, props.debounce);

watch(
  () => props.search,
  (v) => {
    localValue.value = v;
  },
);

watch(localValue, (v) => {
  emit('update:search', v);
  debouncedSearch(v);
});

function clear() {
  localValue.value = '';
  emit('update:search', '');
  emit('search', '');
}

defineExpose({
  focusSearch: () => inputRef.value?.focus(),
});
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <div class="relative flex-1 min-w-[200px]">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        ref="inputRef"
        :value="localValue"
        @input="localValue = ($event.target as HTMLInputElement).value"
        type="search"
        :placeholder="`${placeholder} (⌘K)`"
        class="w-full pl-10 pr-8 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

    <Button
      v-if="showFilters"
      variant="outline"
      size="sm"
      @click="$emit('open-filters')"
      class="touch-target"
    >
      <Filter class="w-4 h-4 mr-1" />
      Filters
    </Button>

    <Button
      v-if="showExport"
      variant="outline"
      size="sm"
      @click="$emit('export')"
      class="touch-target"
    >
      <Download class="w-4 h-4 mr-1" />
      Export
    </Button>

    <Button
      size="sm"
      variant="ghost"
      @click="$emit('clear-all')"
      class="touch-target"
    >
      Clear All
    </Button>
  </div>
</template>
