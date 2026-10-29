<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { ShoppingCart, ArrowRight, Printer } from '@lucide/vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/shared/lib/api-client';

const props = withDefaults(
  defineProps<{ limit?: number }>(),
  { limit: 5 },
);

const emit = defineEmits<{
  (e: 'reprint', saleId: string): void;
}>();

const { data } = useQuery({
  queryKey: ['recent-sales-pos'],
  queryFn: async () => {
    const res = await apiClient.get('/sales', { params: { limit: String(props.limit), page: '1' } });
    return res.data.data.items as Array<{
      id: string;
      number: string;
      customerName?: string;
      total: number;
      itemCount: number;
      createdAt: string;
      status: string;
    }>;
  },
  staleTime: 30_000,
  refetchInterval: 60_000,
});

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
</script>

<template>
  <div>
    <h3 class="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
      <ShoppingCart class="w-3.5 h-3.5" />
      Recent Sales
    </h3>
    <div v-if="!data || data.length === 0" class="text-xs text-muted-foreground/60 py-1">
      No recent sales
    </div>
    <div v-else class="flex flex-wrap gap-2">
      <div
        v-for="sale in data.slice(0, limit)"
        :key="sale.id"
        class="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors min-w-[200px]"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ sale.customerName || 'Walk-in' }}</p>
          <p class="text-xs text-muted-foreground">{{ formatTime(sale.createdAt) }} · {{ sale.number }}</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <Badge :variant="sale.status === 'RETURNED' ? 'secondary' : 'default'" class="text-xs capitalize">
            {{ sale.status.toLowerCase() }}
          </Badge>
          <span class="text-sm font-semibold">KES {{ sale.total.toLocaleString() }}</span>
          <Button variant="ghost" size="icon" class="h-6 w-6" @click="emit('reprint', sale.id)">
            <Printer class="w-3 h-3" />
          </Button>
          <ArrowRight class="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  </div>
</template>
