<script setup lang="ts">
import { computed } from 'vue';
import {
  Package,
  Archive,
  Edit,
  Trash2,
  Download,
  Tag,
  Layers,
  CheckCircle,
  PauseCircle,
} from '@lucide/vue';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const props = withDefaults(
  defineProps<{
    totalCount: number;
    selectedCount: number;
    selectedProductNames?: string[];
  }>(),
  { totalCount: 0, selectedCount: 0, selectedProductNames: () => [] },
);

const emit = defineEmits<{
  (e: 'change-category'): void;
  (e: 'change-brand'): void;
  (e: 'change-tax'): void;
  (e: 'change-unit'): void;
  (e: 'activate'): void;
  (e: 'deactivate'): void;
  (e: 'archive'): void;
  (e: 'delete'): void;
  (e: 'export'): void;
  (e: 'clear-selection'): void;
}>();

const selectionLabel = computed(() => {
  if (props.selectedCount === 0) return 'No products selected';
  if (props.selectedCount === props.totalCount) return 'All products selected';
  return `${props.selectedCount} of ${props.totalCount} selected`;
});
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 p-4 bg-card border-b transition-all"
  >
    <div v-if="selectedCount === 0" class="flex items-center gap-3 flex-1">
      <div class="flex-1">
        <slot name="toolbar-left">
          <p class="text-sm text-muted-foreground">
            {{ selectionLabel }}
          </p>
        </slot>
      </div>
      <div class="flex items-center gap-2">
        <slot name="toolbar-actions" />
      </div>
    </div>

    <div
      v-else
      class="flex items-center justify-between gap-3 flex-1"
    >
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div
            class="flex -space-x-1"
            v-if="selectedProductNames && selectedProductNames.length > 0"
          >
            <div
              v-for="i in Math.min(selectedProductNames.length, 3)"
              :key="i"
              class="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center"
            >
              <Package class="w-3 h-3 text-muted-foreground" />
            </div>
            <span
              v-if="selectedProductNames.length > 3"
              class="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs"
            >
              +{{ selectedProductNames.length - 3 }}
            </span>
          </div>
          <span class="text-sm font-medium">
            {{ selectionLabel }}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          @click="$emit('clear-selection')"
        >
          Clear
        </Button>
      </div>

      <div class="flex items-center gap-2 flex-wrap justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="touch-target">
              <Edit class="w-4 h-4 mr-1" />
              Bulk Edit
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="$emit('change-category')">
              <Tag class="h-4 w-4 mr-2" />
              Change Category
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('change-brand')">
              <Layers class="h-4 w-4 mr-2" />
              Change Brand
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('change-tax')">
              <Tag class="h-4 w-4 mr-2" />
              Change Tax
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('change-unit')">
              <Package class="h-4 w-4 mr-2" />
              Change Unit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="$emit('activate')">
              <CheckCircle class="h-4 w-4 mr-2" />
              Activate
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('deactivate')">
              <PauseCircle class="h-4 w-4 mr-2" />
              Deactivate
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('archive')">
              <Archive class="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          @click="$emit('export')"
          class="touch-target"
        >
          <Download class="w-4 h-4 mr-1" />
          Export
        </Button>

        <Button
          variant="destructive"
          size="sm"
          @click="$emit('delete')"
          class="touch-target"
        >
          <Trash2 class="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  </div>
</template>
