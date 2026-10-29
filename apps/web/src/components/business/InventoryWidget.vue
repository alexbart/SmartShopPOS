<script setup lang="ts">
import { Package } from '@lucide/vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSkeleton from '@/components/business/LoadingSkeleton.vue';

interface StockByWarehouse {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reserved: number;
}

const props = defineProps<{
  productId: string;
  warehouses?: StockByWarehouse[];
  loading?: boolean;
}>();
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="text-sm font-medium flex items-center gap-2">
        <Package class="w-4 h-4" />
        Inventory by Warehouse
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-2">
        <LoadingSkeleton :rows="3" />
      </div>

      <div v-else-if="!warehouses || warehouses.length === 0">
        <p class="text-sm text-muted-foreground">No warehouse data</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="w in warehouses"
          :key="w.warehouseId"
          class="flex items-center justify-between"
        >
          <span class="text-sm">{{ w.warehouseName }}</span>
          <div class="flex items-center gap-4">
            <span class="text-sm font-medium">{{ w.quantity }}</span>
            <span v-if="w.reserved > 0" class="text-xs text-muted-foreground">
              ({{ w.reserved }} reserved)
            </span>
          </div>
        </div>

        <div class="flex justify-between items-center mt-3 pt-3 border-t">
          <span class="font-medium text-sm">Total Available</span>
          <span class="font-bold text-lg">
            {{ warehouses.reduce((sum, w) => sum + w.quantity, 0) }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
