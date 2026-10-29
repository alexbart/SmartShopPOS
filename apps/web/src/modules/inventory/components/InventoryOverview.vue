<script setup lang="ts">
import { computed } from 'vue';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Archive,
  TrendingUp,
  ShoppingCart,
} from '@lucide/vue';
import { Card, CardContent } from '@/components/ui/card';
import type { Product, StockLevel, StockMovement } from '@/shared/types';

const props = withDefaults(
  defineProps<{
    products: Product[];
    stockLevels: StockLevel[];
    movements: StockMovement[];
    lowStockCount: number;
    outOfStockCount: number;
    totalProducts: number;
    inventoryValue: number;
    todayMovements: number;
  }>(),
  {
    products: () => [],
    stockLevels: () => [],
    movements: () => [],
    lowStockCount: 0,
    outOfStockCount: 0,
    totalProducts: 0,
    inventoryValue: 0,
    todayMovements: 0,
  },
);

const emit = defineEmits<{
  (e: 'view-low-stock'): void;
  (e: 'view-out-of-stock'): void;
  (e: 'receive-goods'): void;
}>();

const stockMap = computed(() => {
  const map = new Map<string, StockLevel>();
  for (const s of props.stockLevels) {
    map.set(s.productId, s);
  }
  return map;
});

const reservedCount = computed(() => {
  return props.stockLevels.reduce((sum, s) => sum + (s.reservedQuantity ?? 0), 0);
});
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-font gap-4 mb-6">
    <Card class="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <Package class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ totalProducts }}</p>
            <p class="text-sm text-muted-foreground">Total Products</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card
      class="cursor-pointer transition-shadow hover:shadow-md"
      @click="emit('view-low-stock')"
    >
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
            <AlertTriangle class="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-orange-600">{{ lowStockCount }}</p>
            <p class="text-sm text-muted-foreground">Low Stock</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card
      class="cursor-pointer transition-shadow hover:shadow-md"
      @click="emit('view-out-of-stock')"
    >
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
            <TrendingDown class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ outOfStockCount }}</p>
            <p class="text-sm text-muted-foreground">Out of Stock</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
            <TrendingUp class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-2xl font-bold">KES {{ Math.round(inventoryValue).toLocaleString() }}</p>
            <p class="text-sm text-muted-foreground">Inventory Value</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
            <ShoppingCart class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ todayMovements }}</p>
            <p class="text-sm text-muted-foreground">Today's Movements</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/30">
            <Archive class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ reservedCount }}</p>
            <p class="text-sm text-muted-foreground">Reserved</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card class="lg:col-span-2">
      <CardContent class="p-4">
        <h3 class="text-lg font-semibold mb-3">Recent Activity</h3>
        <div class="space-y-3">
          <div
            v-for="movement in movements.slice(0, 5)"
            :key="movement.id"
            class="flex items-center gap-3 text-sm"
          >
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Move3D class="w-4 h-4 text-primary" v-if="movement.type === 'SALE'" />
              <TrendingUp class="w-4 h-4 text-green-600" v-else-if="['PURCHASE', 'RETURN', 'TRANSFER_IN'].includes(movement.type)" />
              <TrendingDown class="w-4 h-4 text-red-600" v-else-if="['SALE', 'ADJUSTMENT', 'TRANSFER_OUT'].includes(movement.type)" />
              <Archive class="w-4 h-4 text-blue-600" v-else />
            </div>
            <div class="flex-1">
              <p class="font-medium">{{ movement.remarks || movement.type }}</p>
              <p class="text-xs text-muted-foreground">
                {{ movement.createdAt }} · Qty: {{ movement.quantity }}
              </p>
            </div>
          </div>
          <div v-if="!movements.length" class="text-center py-6 text-muted-foreground">
            <p class="text-sm">No recent movements</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4">
        <h3 class="text-lg font-semibold mb-3">Quick Actions</h3>
        <div class="space-y-2">
          <button
            @click="emit('receive-goods')"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <TrendingUp class="w-4 h-4" />
            Receive Goods
          </button>
          <button
            @click="$emit('view-low-stock')"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <AlertTriangle class="w-4 h-4 text-orange-600" />
            Review Low Stock
          </button>
          <button
            @click="$emit('view-out-of-stock')"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <TrendingDown class="w-4 h-4 text-red-600" />
            Review Out of Stock
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
