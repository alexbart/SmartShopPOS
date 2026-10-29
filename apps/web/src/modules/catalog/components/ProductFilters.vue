<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDown, ChevronUp } from '@lucide/vue';

interface FilterOption {
  label: string;
  value: string | number | null;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  value: string | string[] | null;
}

const props = withDefaults(
  defineProps<{
    filters: FilterGroup[];
    collapsed?: boolean;
  }>(),
  { collapsed: false },
);

const emit = defineEmits<{
  (e: 'filter-change', key: string, value: string | null): void;
  (e: 'clear'): void;
}>();

const isCollapsed = ref(props.collapsed);

const hasActiveFilters = computed(() =>
  props.filters.some((f) => {
    if (Array.isArray(f.value)) return f.value.length > 0;
    return f.value !== null && f.value !== '';
  }),
);

function onFilterChange(key: string, value: string | null) {
  emit('filter-change', key, value);
}

function clearAll() {
  emit('clear');
}
</script>

<template>
  <div class="border-l border-border ml-2 first:ml-0 first:border-l-0">
    <div
      class="flex items-center justify-between cursor-pointer px-3 py-2"
      @click="isCollapsed = !isCollapsed"
    >
      <h3 class="text-sm font-medium text-muted-foreground">Filters</h3>
      <div class="flex items-center gap-2">
        <span v-if="hasActiveFilters" class="text-xs text-primary font-medium">
          {{ props.filters.filter((f) => f.value).length }} active
        </span>
        <button
          v-if="hasActiveFilters"
          @click.stop="clearAll"
          class="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear all
        </button>
        <ChevronDown v-if="!isCollapsed" class="w-4 h-4 text-muted-foreground transition-transform" />
        <ChevronUp v-else class="w-4 h-4 text-muted-foreground transition-transform" />
      </div>
    </div>

    <div
      v-show="!isCollapsed"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 py-4 px-3"
    >
      <div v-for="filter in props.filters" :key="filter.key">
        <label class="block text-xs font-medium text-muted-foreground mb-1">{{ filter.label }}</label>
        <select
          :value="filter.value"
          @change="onFilterChange(filter.key, ($event.target as HTMLSelectElement).value || null)"
          class="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option :value="null">All</option>
          <option
            v-for="opt in filter.options"
            :key="String(opt.value)"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
