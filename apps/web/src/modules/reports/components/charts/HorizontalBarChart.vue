<script setup lang="ts">
import { computed } from 'vue';
import { NEGATIVE_COLOR, colorize, type ChartDatum } from './chart-utils';

const props = defineProps<{
  items: ChartDatum[];
  formatter?: (value: number) => string;
}>();

const data = computed(() => colorize(props.items));
const maximum = computed(() => Math.max(...data.value.map((item) => Math.abs(item.value)), 0));

const display = (value: number) => (props.formatter ? props.formatter(value) : String(value));
const widthOf = (value: number) =>
  maximum.value ? Math.max((Math.abs(value) / maximum.value) * 100, value !== 0 ? 1 : 0) : 0;
const colorOf = (item: ChartDatum) => (item.value < 0 ? NEGATIVE_COLOR : item.color);
</script>

<template>
  <ul class="space-y-2.5">
    <li
      v-for="item in data"
      :key="item.label"
      class="grid grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_auto] items-center gap-3 text-sm"
    >
      <span class="truncate" :title="item.label">{{ item.label }}</span>
      <span class="h-2.5 overflow-hidden rounded-full bg-muted/40">
        <span
          class="block h-full rounded-full"
          :style="{ width: `${widthOf(item.value)}%`, background: colorOf(item) }"
        ></span>
      </span>
      <span class="tabular-nums text-muted-foreground">{{ display(item.value) }}</span>
    </li>
  </ul>
</template>
