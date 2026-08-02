<script setup lang="ts">
import { Plus, Package } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: 'No products yet',
    description: 'Create your first product to begin selling.',
  },
);
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <div class="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
      <Package class="w-8 h-8 text-muted-foreground/50" />
    </div>
    <p class="text-lg font-medium text-muted-foreground mb-1">
      {{ title }}
    </p>
    <p class="text-sm text-muted-foreground/70 mb-4 text-center max-w-sm">
      {{ description }}
    </p>
    <div class="flex gap-2">
      <slot name="actions">
        <button class="btn btn-primary touch-target">
          <Plus class="w-4 h-4 mr-1" />
          Add Product
        </button>
      </slot>
    </div>
  </div>
</template>
