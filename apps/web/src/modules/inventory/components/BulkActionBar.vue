<script setup lang="ts">
import { Download, Printer, Archive, Trash2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';

const props = withDefaults(
  defineProps<{
    selectedCount: number;
  }>(),
  {
    selectedCount: 0,
  },
);

const emit = defineEmits<{
  (e: 'export'): void;
  (e: 'print-labels'): void;
  (e: 'archive'): void;
  (e: 'delete'): void;
}>();
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t bg-card"
  >
    <div
      v-if="selectedCount > 0"
      class="text-sm text-muted-foreground"
    >
      {{ selectedCount }} product(s) selected
    </div>

    <div class="flex gap-2 ml-auto">
      <Button
        variant="outline"
        size="sm"
        class="touch-target"
        @click="emit('export')"
      >
        <Download class="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="touch-target"
        @click="emit('print-labels')"
      >
        <Printer class="w-4 h-4 mr-2" />
        Print Labels
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="touch-target"
        @click="emit('archive')"
      >
        <Archive class="w-4 h-4 mr-2" />
        Archive
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="touch-target hover:bg-destructive/10 hover:text-destructive"
        @click="emit('delete')"
      >
        <Trash2 class="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  </div>
</template>
