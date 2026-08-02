<script setup lang="ts">
import { ref, watch } from 'vue';
import { Settings } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface ColumnDef {
  key: string;
  label: string;
  default: boolean;
}

const props = withDefaults(
  defineProps<{
    storageKey?: string;
  }>(),
  { storageKey: 'catalog-columns' },
);

const emit = defineEmits<{
  (e: 'update:columns', columns: string[]): void;
}>();

const defaultColumns: ColumnDef[] = [
  { key: 'image', label: 'Image', default: true },
  { key: 'product', label: 'Product', default: true },
  { key: 'sku', label: 'SKU', default: true },
  { key: 'category', label: 'Category', default: true },
  { key: 'status', label: 'Status', default: true },
  { key: 'stock', label: 'Stock', default: true },
  { key: 'price', label: 'Price', default: true },
  { key: 'brand', label: 'Brand', default: false },
  { key: 'barcode', label: 'Barcode', default: false },
  { key: 'unit', label: 'Unit', default: false },
  { key: 'tax', label: 'Tax', default: false },
];

const visibleColumns = ref<Record<string, boolean>>({});

function loadFromStorage(): Record<string, boolean> {
  const stored = localStorage.getItem(props.storageKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  const defaults: Record<string, boolean> = {};
  defaultColumns.forEach((c) => {
    defaults[c.key] = c.default;
  });
  return defaults;
}

Object.assign(visibleColumns.value, loadFromStorage());

watch(
  visibleColumns,
  () => {
    localStorage.setItem(props.storageKey, JSON.stringify(visibleColumns.value));
    const visible = Object.entries(visibleColumns.value)
      .filter(([, v]) => v)
      .map(([k]) => k);
    emit('update:columns', visible);
  },
  { deep: true },
);

function isColumnVisible(key: string): boolean {
  return visibleColumns.value[key] ?? defaultColumns.find((c) => c.key === key)?.default ?? false;
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="touch-target"
        title="Customize columns"
      >
        <Settings class="w-4 h-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-56">
      <div class="space-y-2">
        <h4 class="text-sm font-medium">Visible Columns</h4>
        <div class="space-y-1.5 pt-2">
          <div
            v-for="col in defaultColumns"
            :key="col.key"
            class="flex items-center justify-between"
          >
            <label class="flex items-center gap-2 cursor-pointer">
              <Checkbox
                :model-value="isColumnVisible(col.key)"
                @update:modelValue="
                  (checked: boolean | 'indeterminate') => {
                    visibleColumns[col.key] = checked as boolean;
                  }
                "
              />
              <span class="text-sm">{{ col.label }}</span>
            </label>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>