<script setup lang="ts">
import { computed } from 'vue';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Archive,
} from '@lucide/vue';
import { Card, CardContent } from '@/components/ui/card';

const props = withDefaults(
  defineProps<{
    products: Array<{
      id: string;
      stockQuantity?: number;
      lowStockThreshold?: number;
      isActive: boolean;
    }>;
  }>(),
  { products: () => [] },
);

const emit = defineEmits<{
  (e: 'filter-healthy'): void;
  (e: 'filter-low'): void;
  (e: 'filter-out'): void;
  (e: 'filter-archived'): void;
}>();

const healthStats = computed(() => {
  const all = props.products;
  const archived = all.filter((p) => !p.isActive);
  const active = all.filter((p) => p.isActive);
  const outOfStock = active.filter((p) => (p.stockQuantity ?? 0) === 0);
  const lowStock = active.filter(
    (p) =>
      (p.stockQuantity ?? 0) > 0 &&
      (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 0),
  );
  const healthy = active.filter(
    (p) =>
      (p.stockQuantity ?? 0) > (p.lowStockThreshold ?? 0) &&
      (p.stockQuantity ?? 0) > 0,
  );

  return {
    healthy: healthy.length,
    low: lowStock.length,
    out: outOfStock.length,
    archived: archived.length,
    total: all.length,
  };
});
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
    <Card
      class="cursor-pointer transition-shadow hover:shadow-md"
      @click="$emit('filter-healthy')"
    >
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
            <Package class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ healthStats.healthy }}</p>
            <p class="text-sm text-muted-foreground">Healthy</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card
      class="cursor-pointer transition-shadow hover:shadow-md"
      @click="$emit('filter-low')"
    >
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
            <AlertTriangle class="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-orange-600">{{ healthStats.low }}</p>
            <p class="text-sm text-muted-foreground">Low Stock</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card
      class="cursor-pointer transition-shadow hover:shadow-md"
      @click="$emit('filter-out')"
    >
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
            <TrendingDown class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ healthStats.out }}</p>
            <p class="text-sm text-muted-foreground">Out of Stock</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card
      class="cursor-pointer transition-shadow hover:shadow-md"
      @click="$emit('filter-archived')"
    >
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/30">
            <Archive class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-600">{{ healthStats.archived }}</p>
            <p class="text-sm text-muted-foreground">Archived</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
