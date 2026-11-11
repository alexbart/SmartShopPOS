<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    class?: string;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const fillPercentage = computed(() => {
  const span = props.max - props.min;
  if (span <= 0) return 0;
  const ratio = ((props.modelValue - props.min) / span) * 100;
  return Math.min(100, Math.max(0, ratio));
});

function handleInput(event: Event) {
  emit('update:modelValue', Number((event.target as HTMLInputElement).value));
}
</script>

<template>
  <!-- The native range stays on top for keyboard and drag support; the track
       and thumb below are plain elements so the look is identical everywhere. -->
  <div :class="cn('relative flex h-5 w-full items-center', disabled && 'opacity-50', props.class)">
    <div class="h-2 w-full rounded-full bg-muted">
      <div class="h-2 rounded-full bg-primary" :style="{ width: `${fillPercentage}%` }" />
    </div>

    <div
      class="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow"
      :style="{ left: `${fillPercentage}%` }"
    />

    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      :aria-valuetext="String(modelValue)"
      @input="handleInput"
    />
  </div>
</template>
