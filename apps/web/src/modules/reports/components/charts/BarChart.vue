<script setup lang="ts">
import { computed } from 'vue';
import { colorize, type ChartDatum } from './chart-utils';

const props = withDefaults(
  defineProps<{
    items: ChartDatum[];
    formatter?: (value: number) => string;
    maxItems?: number;
  }>(),
  { maxItems: 12 },
);

const data = computed(() => colorize(props.items.slice(0, props.maxItems)));
const maximum = computed(() => Math.max(...data.value.map((item) => Math.abs(item.value)), 0));

const display = (value: number) => (props.formatter ? props.formatter(value) : String(value));
const heightOf = (value: number) => {
  if (!maximum.value) return 0;
  return Math.max((Math.abs(value) / maximum.value) * 100, value !== 0 ? 3 : 0);
};
</script>

<template>
  <div class="flex h-44 items-end gap-2 border-b border-l px-2 pb-1 pt-4">
    <div
      v-for="item in data"
      :key="item.label"
      class="group flex h-full min-w-0 flex-1 flex-col justify-end"
    >
      <div
        class="mb-1 text-center text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100"
      >
        {{ display(item.value) }}
      </div>
      <div
        class="mx-auto w-2/3 rounded-t transition-opacity group-hover:opacity-75"
        :style="{
          height: `${heightOf(item.value)}%`,
          minHeight: item.value ? '4px' : '0',
          background: item.color,
        }"
        :title="`${item.label}: ${display(item.value)}`"
      ></div>
      <span class="mt-2 truncate text-center text-xs text-muted-foreground">{{ item.label }}</span>
    </div>
  </div>
</template>
