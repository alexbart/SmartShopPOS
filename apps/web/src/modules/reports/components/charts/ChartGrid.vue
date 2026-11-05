<script setup lang="ts">
import type { Component } from 'vue';
import BarChart from './BarChart.vue';
import ChartCard from './ChartCard.vue';
import DonutChart from './DonutChart.vue';
import HorizontalBarChart from './HorizontalBarChart.vue';
import LineChart from './LineChart.vue';
import type { ChartKind, ChartSpec } from './chart-utils';

defineProps<{ specs: ChartSpec[] }>();

const components: Record<ChartKind, Component> = {
  bar: BarChart,
  hbar: HorizontalBarChart,
  donut: DonutChart,
  line: LineChart,
};
</script>

<template>
  <div class="mb-5 grid gap-4 lg:grid-cols-2">
    <ChartCard
      v-for="spec in specs"
      :key="spec.key"
      :title="spec.title"
      :description="spec.description"
      :meta="spec.meta"
      :empty="spec.items.length === 0"
    >
      <component
        :is="components[spec.kind]"
        :items="spec.items"
        :formatter="spec.formatter"
        :center-label="spec.centerLabel"
      />
    </ChartCard>
  </div>
</template>
