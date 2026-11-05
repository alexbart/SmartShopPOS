<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  meta?: string;
  empty?: boolean;
  emptyMessage?: string;
}>();
</script>

<template>
  <section class="card p-5">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 class="font-semibold">{{ title }}</h2>
        <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
      </div>
      <span v-if="meta" class="whitespace-nowrap text-sm font-medium">{{ meta }}</span>
    </div>

    <div v-if="!empty">
      <slot />
    </div>
    <div
      v-else
      class="flex h-40 items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground"
    >
      {{ emptyMessage ?? 'No data for the current filters.' }}
    </div>
  </section>
</template>
