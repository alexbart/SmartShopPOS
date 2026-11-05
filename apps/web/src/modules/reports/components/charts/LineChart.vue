<script setup lang="ts">
import { computed } from 'vue';
import type { ChartDatum } from './chart-utils';

const props = defineProps<{
  items: ChartDatum[];
  formatter?: (value: number) => string;
}>();

const WIDTH = 320;
const HEIGHT = 120;
const PADDING = 6;
const BASELINE = HEIGHT - PADDING;

const display = (value: number) => (props.formatter ? props.formatter(value) : String(value));
const maximum = computed(() => Math.max(...props.items.map((item) => item.value), 0));

const points = computed(() => {
  const items = props.items;
  const step = items.length > 1 ? (WIDTH - PADDING * 2) / (items.length - 1) : 0;

  return items.map((item, index) => ({
    item,
    x: PADDING + step * index,
    y: maximum.value ? BASELINE - (item.value / maximum.value) * (HEIGHT - PADDING * 2) : BASELINE,
  }));
});

const polyline = computed(() =>
  points.value.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),
);

const areaPath = computed(() => {
  const list = points.value;
  if (!list.length) return '';
  const line = list.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  return `M ${list[0].x.toFixed(2)} ${BASELINE} ${line} L ${list[list.length - 1].x.toFixed(2)} ${BASELINE} Z`;
});

const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => BASELINE - ratio * (HEIGHT - PADDING * 2));
const middle = computed(() => props.items[Math.floor(props.items.length / 2)]);
const last = computed(() => props.items[props.items.length - 1]);
</script>

<template>
  <div>
    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="h-40 w-full text-primary"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        v-for="(y, index) in gridLines"
        :key="index"
        x1="0"
        :y1="y"
        :x2="WIDTH"
        :y2="y"
        stroke="currentColor"
        stroke-opacity="0.12"
        vector-effect="non-scaling-stroke"
      />
      <path :d="areaPath" fill="currentColor" fill-opacity="0.12" />
      <polyline
        :points="polyline"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <circle
        v-for="point in points"
        :key="point.item.label"
        :cx="point.x"
        :cy="point.y"
        r="2.5"
        fill="currentColor"
      >
        <title>{{ point.item.label }}: {{ display(point.item.value) }}</title>
      </circle>
    </svg>

    <div class="mt-2 flex justify-between text-xs text-muted-foreground">
      <span>{{ items[0]?.label }}</span>
      <span v-if="items.length > 2">{{ middle?.label }}</span>
      <span>{{ last?.label }}</span>
    </div>
  </div>
</template>
