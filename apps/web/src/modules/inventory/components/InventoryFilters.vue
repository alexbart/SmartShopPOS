<script setup lang="ts">
import { computed } from 'vue';
import { ShoppingCart } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import type { Warehouse as WarehouseType } from '@/shared/types';

const props = withDefaults(
  defineProps<{
    warehouses: WarehouseType[];
    selectedWarehouse: string | null;
  }>(),
  {
    warehouses: () => [],
    selectedWarehouse: null,
  },
);

const emit = defineEmits<{
  (e: 'update:warehouse', value: string | null): void;
  (e: 'receive-goods'): void;
}>();

const warehouseOptions = computed(() => props.warehouses);
</script>

<template>
  <div class="flex items-center gap-3 flex-wrap">
    <select
      :value="selectedWarehouse ?? ''"
      @change="emit('update:warehouse', ($event.target as HTMLSelectElement).value || null)"
      class="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
    >
      <option value="">All Warehouses</option>
      <option v-for="w in warehouseOptions" :key="w.id" :value="w.id">
        {{ w.name }} ({{ w.code }})
      </option>
    </select>

    <Button
      variant="outline"
      size="sm"
      class="touch-target"
      @click="emit('receive-goods')"
    >
      <ShoppingCart class="w-4 h-4 mr-2" />
      Receive Goods
    </Button>
  </div>
</template>
