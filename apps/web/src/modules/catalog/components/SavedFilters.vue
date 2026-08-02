<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Plus,
  Save,
  Filter,
  Tag,
  Package,
  Sparkles,
} from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SavedFilter {
  id: string;
  name: string;
  icon: any;
  filters: Record<string, unknown>;
}

const props = withDefaults(
  defineProps<{
    storageKey?: string;
  }>(),
  { storageKey: 'catalog-saved-filters' },
);

const emit = defineEmits<{
  (e: 'apply', filters: Record<string, unknown>): void;
}>();

const savedFilters = ref<SavedFilter[]>([]);
const showSaveDialog = ref(false);
const newFilterName = ref('');

const filterPresets = [
  {
    id: 'low-stock',
    name: 'Low Stock',
    icon: Package,
    label: 'Products with low stock',
    filters: { status: 'low' },
  },
  {
    id: 'dairy',
    name: 'Dairy',
    icon: Tag,
    label: 'Dairy category products',
    filters: { category: 'dairy' },
  },
  {
    id: 'active',
    name: 'Active Products',
    icon: Sparkles,
    label: 'Currently active products',
    filters: { status: 'true' },
  },
  {
    id: 'imported',
    name: 'Imported Items',
    icon: Package,
    label: 'Recently imported products',
    filters: { imported: 'true' },
  },
];

onMounted(() => {
  const stored = localStorage.getItem(props.storageKey);
  if (stored) {
    savedFilters.value = JSON.parse(stored);
  }
});

function applyPreset(preset: (typeof filterPresets)[number]) {
  emit('apply', preset.filters);
}

function applySaved(filter: SavedFilter) {
  emit('apply', filter.filters);
}

function saveCurrentFilter() {
  if (!newFilterName.value.trim()) return;
  const newFilter: SavedFilter = {
    id: Date.now().toString(),
    name: newFilterName.value,
    icon: Filter,
    filters: {},
  };
  savedFilters.value = [...savedFilters.value, newFilter];
  localStorage.setItem(props.storageKey, JSON.stringify(savedFilters.value));
  newFilterName.value = '';
  showSaveDialog.value = false;
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2 mb-2">
      <Filter class="w-4 h-4 text-muted-foreground" />
      <span class="text-sm font-medium">Saved Filters</span>
      <Button
        variant="ghost"
        size="sm"
        @click="showSaveDialog = true"
        class="ml-auto"
      >
        <Plus class="w-4 h-4 mr-1" />
        Save
      </Button>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="preset in filterPresets"
        :key="preset.id"
        class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        @click="applyPreset(preset)"
      >
        <component :is="preset.icon" class="w-4 h-4 text-muted-foreground" />
        <div class="flex-1">
          <p class="text-sm font-medium">{{ preset.name }}</p>
          <p class="text-xs text-muted-foreground/70">
            {{ preset.label }}
          </p>
        </div>
      </div>
    </div>

    <Separator v-if="savedFilters.length > 0" />

    <div
      v-for="filter in savedFilters"
      :key="filter.id"
      class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      @click="applySaved(filter)"
    >
      <component :is="filter.icon" class="w-4 h-4 text-muted-foreground" />
      <span class="text-sm font-medium">{{ filter.name }}</span>
    </div>

    <div
      v-if="showSaveDialog"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      @click="showSaveDialog = false"
    >
      <div
        class="bg-popover border border-border rounded-lg p-4 space-y-3 w-64"
        @click.stop
      >
        <h3 class="text-sm font-medium">Save Current Filters</h3>
        <Label class="text-xs text-muted-foreground">Filter name</Label>
        <Input
          v-model="newFilterName"
          placeholder="e.g. Weekly Clearance..."
          class="h-8"
        />
        <div class="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            @click="showSaveDialog = false"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            :disabled="!newFilterName.trim()"
            @click="saveCurrentFilter"
          >
            <Save class="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
