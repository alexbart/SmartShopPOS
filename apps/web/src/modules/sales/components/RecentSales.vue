<script setup lang="ts">
import { ShoppingCart, ArrowRight } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';

interface RecentSale {
  id: string;
  customerName: string;
  total: number;
  itemCount: number;
  time: string;
  status: 'completed' | 'returned';
}

const props = withDefaults(
  defineProps<{ limit?: number }>(),
  { limit: 5 },
);

const recentSales: RecentSale[] = [
  { id: '1', customerName: 'Jane Doe', total: 2300, itemCount: 4, time: '10:32 AM', status: 'completed' },
  { id: '2', customerName: 'John Smith', total: 1550, itemCount: 3, time: '10:28 AM', status: 'completed' },
  { id: '3', customerName: 'Walk-in', total: 890, itemCount: 2, time: '10:15 AM', status: 'completed' },
  { id: '4', customerName: 'Mary Johnson', total: 4250, itemCount: 7, time: '09:52 AM', status: 'completed' },
  { id: '5', customerName: 'Jane Doe', total: 175, itemCount: 2, time: '09:45 AM', status: 'returned' },
];
</script>

<template>
  <div>
    <h3 class="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
      <ShoppingCart class="w-3.5 h-3.5" />
      Recent Sales
    </h3>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="sale in recentSales.slice(0, limit)"
        :key="sale.id"
        class="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer min-w-[180px]"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ sale.customerName }}</p>
          <p class="text-xs text-muted-foreground">{{ sale.time }} · {{ sale.itemCount }} items</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <Badge :variant="sale.status === 'returned' ? 'secondary' : 'default'" class="text-xs">
            {{ sale.status }}
          </Badge>
          <span class="text-sm font-semibold">KES {{ sale.total.toLocaleString() }}</span>
          <ArrowRight class="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  </div>
</template>
