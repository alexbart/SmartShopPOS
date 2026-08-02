<script setup lang="ts">
defineProps<{
  selectedIds: string[];
  actions: Array<{
    label: string;
    icon?: any;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    action: (selectedIds: string[]) => void;
  }>;
}>();
</script>

<template>
  <div class="flex items-center justify-between bg-muted/30 px-4 py-3 rounded-lg mb-4">
    <span class="text-sm font-medium">{{ selectedIds.length }} selected</span>
    <div class="flex items-center gap-2">
      <template v-for="(action, i) in actions" :key="i">
        <button
          @click="action.action(selectedIds)"
          class="btn btn-sm btn-outline"
          :class="action.variant === 'destructive' ? 'btn-destructive' : ''"
        >
          <component v-if="action.icon" :is="action.icon" class="w-4 h-4 mr-1" />
          {{ action.label }}
        </button>
      </template>
    </div>
  </div>
</template>
