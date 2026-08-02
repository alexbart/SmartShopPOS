<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string;
    alt: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    rounded?: boolean;
    status?: 'default' | 'sale' | 'out';
  }>(),
  { size: 'md', rounded: true, status: 'default' },
);

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const roundedClass = props.rounded ? 'rounded-lg' : 'rounded';

const statusOverlay = {
  sale: 'ring-2 ring-blue-500 ring-offset-2',
  out: 'grayscale',
  default: '',
};
</script>

<template>
  <div
    :class="[
      'flex-shrink-0 overflow-hidden transition-transform duration-200 hover:scale-105 border border-border bg-muted',
      sizeClasses[props.size],
      roundedClass,
      statusOverlay[props.status],
    ]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover"
      loading="lazy"
    />
    <div
      v-else
      class="w-full h-full flex items-center justify-center bg-muted"
    >
      <span class="text-xs font-bold text-muted-foreground">
        {{ alt?.substring(0, 2).toUpperCase() }}
      </span>
    </div>
  </div>
</template>
