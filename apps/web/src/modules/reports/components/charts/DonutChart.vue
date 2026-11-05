<script setup lang="ts">
import { computed } from 'vue';
import { colorize, type ChartDatum } from './chart-utils';

const props = withDefaults(
  defineProps<{
    items: ChartDatum[];
    formatter?: (value: number) => string;
    centerLabel?: string;
  }>(),
  { centerLabel: 'Total' },
);

const data = computed(() => colorize(props.items.filter((item) => item.value > 0)));
const total = computed(() => data.value.reduce((sum, item) => sum + item.value, 0));

const display = (value: number) => (props.formatter ? props.formatter(value) : String(value));
const percentOf = (value: number) => (total.value ? (value / total.value) * 100 : 0);

const gradient = computed(() => {
  if (!total.value) return 'conic-gradient(#e5e7eb 0% 100%)';
  let cursor = 0;
  const stops = data.value.map((item) => {
    const start = cursor;
    cursor += percentOf(item.value);
    return `${item.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
});
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-6 sm:justify-start">
    <div
      class="relative h-40 w-40 shrink-0 rounded-full"
      :style="{ background: gradient }"
      role="img"
      :aria-label="`Donut chart of ${centerLabel.toLowerCase()} by category`"
    >
      <div class="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-card">
        <span class="text-xs text-muted-foreground">{{ centerLabel }}</span>
        <span class="text-center text-sm font-semibold">{{ display(total) }}</span>
      </div>
    </div>

    <ul class="min-w-40 flex-1 space-y-2 text-sm">
      <li v-for="item in data" :key="item.label" class="flex items-center justify-between gap-4">
        <span class="flex min-w-0 items-center gap-2">
          <i class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: item.color }"></i>
          <span class="truncate" :title="item.label">{{ item.label }}</span>
        </span>
        <span class="whitespace-nowrap text-muted-foreground">
          {{ percentOf(item.value).toFixed(1) }}% · {{ display(item.value) }}
        </span>
      </li>
    </ul>
  </div>
</template>
