<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Package,
  Warehouse,
  Search,
  Download,
  Sun,
  Calendar,
  Filter,
} from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StockMovement } from '@/shared/types';

interface WarehouseOption {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

const props = withDefaults(
  defineProps<{
    movements: StockMovement[];
    warehouses: WarehouseOption[];
    selectedWarehouse: string | null;
  }>(),
  {
    movements: () => [],
    warehouses: () => [],
    selectedWarehouse: null,
  },
);

const searchQuery = ref('');
const typeFilter = ref<string | null>(null);
const dateFilter = ref<'today' | 'week' | 'month' | 'all'>('today');

const movementTypes = [
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'SALE', label: 'Sale' },
  { value: 'RETURN', label: 'Return' },
  { value: 'TRANSFER_IN', label: 'Transfer In' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'EXPIRED', label: 'Expired' },
];

const filteredMovements = computed(() => {
  let result = props.movements;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (m) => m.remarks?.toLowerCase().includes(q) || m.type.toLowerCase().includes(q),
    );
  }

  if (typeFilter.value) {
    result = result.filter((m) => m.type === typeFilter.value);
  }

  if (dateFilter.value !== 'all') {
    const now = new Date();
    let cutoff: Date;

    switch (dateFilter.value) {
      case 'today':
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      default:
        cutoff = new Date(0);
    }

    result = result.filter((m) => new Date(m.createdAt) >= cutoff);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

const groupedMovements = computed(() => {
  const groups: { date: string; items: StockMovement[] }[] = [];
  let currentGroup: { date: string; items: StockMovement[] } | null = null;

  for (const movement of filteredMovements.value) {
    const date = movement.createdAt.split('T')[0];
    if (!currentGroup || currentGroup.date !== date) {
      currentGroup = { date, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(movement);
  }

  return groups;
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'PURCHASE':
      return { icon: Package, color: 'text-green-600' };
    case 'SALE':
      return { icon: Package, color: 'text-red-600' };
    case 'RETURN':
      return { icon: Package, color: 'text-blue-600' };
    case 'TRANSFER_IN':
      return { icon: Package, color: 'text-purple-600' };
    case 'TRANSFER_OUT':
      return { icon: Package, color: 'text-orange-600' };
    case 'ADJUSTMENT':
      return { icon: Package, color: 'text-yellow-600' };
    default:
      return { icon: Package, color: 'text-muted-foreground' };
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px]">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search movements..."
          class="w-full pl-8 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <select
        v-model="typeFilter"
        class="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Types</option>
        <option v-for="t in movementTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>

      <select
        v-model="dateFilter"
        class="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="today">Today</option>
        <option value="week">Last 7 days</option>
        <option value="month">Last 30 days</option>
        <option value="all">All time</option>
      </select>
    </div>

    <div class="text-xs text-muted-foreground">
      {{ filteredMovements.length }} movements found
    </div>

    <div
      v-if="filteredMovements.length === 0"
      class="text-center py-16 text-muted-foreground"
    >
      <Package class="h-12 w-12 mx-auto mb-3 opacity-20" />
      <p class="font-medium">No movements found</p>
      <p class="text-sm mt-1">Try adjusting your filters</p>
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="group in groupedMovements"
        :key="group.date"
        class="space-y-3"
      >
        <div class="flex items-center gap-2 text-sm font-medium">
          <Calendar class="w-4 h-4 text-muted-foreground" />
          <span>{{ formatDate(group.date) }}</span>
        </div>

        <div class="relative pl-6 border-l-2 border-border">
          <div
            v-for="(movement, i) in group.items"
            :key="movement.id"
            class="relative mb-4 last:mb-0"
          >
            <div
              class="absolute -left-2 w-4 h-4 rounded-full bg-primary"
              :class="i === 0 ? 'top-0' : ''"
            ></div>

            <div class="ml-6">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3">
                  <div
                    class="p-2 rounded-lg"
                    :class="{
                      'bg-green-50 dark:bg-green-950/30': movement.type === 'PURCHASE' || movement.type === 'RETURN',
                      'bg-red-50 dark:bg-red-950/30': movement.type === 'SALE',
                      'bg-purple-50 dark:bg-purple-950/30': movement.type === 'TRANSFER_IN',
                      'bg-orange-50 dark:bg-orange-950/30': movement.type === 'TRANSFER_OUT',
                      'bg-yellow-50 dark:bg-yellow-950/30': movement.type === 'ADJUSTMENT',
                      'bg-gray-50 dark:bg-gray-950/30': ['DAMAGE', 'EXPIRED'].includes(movement.type),
                    }"
                  >
                    <component
                      :is="getTypeIcon(movement.type).icon"
                      class="w-4 h-4"
                      :class="getTypeIcon(movement.type).color"
                    />
                  </div>

                  <div>
                    <p class="font-medium">{{ movement.remarks || movement.type }}</p>
                    <div class="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <Badge variant="secondary" class="text-xs">
                        {{ movementTypes.find((t) => t.value === movement.type)?.label || movement.type }}
                      </Badge>
                      <span>Qty: {{ movement.quantity }}</span>
                      <span class="flex items-center gap-1">
                        <Calendar class="w-3 h-3" />
                        {{ formatTime(movement.createdAt) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
