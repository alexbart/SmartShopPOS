<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    src?: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg';
    rounded?: boolean;
  }>(),
  { size: 'md', rounded: true }
);

const imgClass = computed(() => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  const roundedClass = props.rounded ? 'rounded-md' : 'rounded';
  return `${sizeClasses[props.size]} ${roundedClass} overflow-hidden flex-shrink-0`;
});
</script>

<template>
  <div
    v-if="src"
    :class="imgClass"
    class="border border-border bg-muted transition-transform duration-200 hover:scale-105"
  >
    <img :src="src" :alt="alt" class="w-full h-full object-cover" loading="lazy" />
  </div>
  <div
    v-else
    :class="imgClass"
    class="bg-muted flex items-center justify-center"
  >
    <span class="text-xs font-bold text-muted-foreground">
      {{ alt?.substring(0, 2).toUpperCase() }}
    </span>
  </div>
</template>
