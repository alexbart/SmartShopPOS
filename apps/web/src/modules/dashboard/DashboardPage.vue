<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';

interface DashboardData {
  today?: { sales: number; transactions: number; customers: number };
  inventory?: { lowStock: number; outOfStock: number };
  salesTrend: Array<{ date: string; amount: number }>;
  paymentMix: Array<{ method: string; amount: number }>;
  topProducts: Array<{ productId: string; name: string; quantitySold: number }>;
  recentSales: Array<{ saleNumber: string; customer: string; amount: number; status: string }>;
}

const { data: dashboard, isLoading } = useQuery<DashboardData>({
  queryKey: ['dashboard'],
  queryFn: async () => {
    const response = await apiClient.get('/dashboard');
    return (response.data as { data: DashboardData }).data;
  },
});

const currency = (value: number) => new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES', maximumFractionDigits: 0,
}).format(value ?? 0);
const salesBars = computed(() => {
  const values = dashboard.value?.salesTrend ?? [];
  const maximum = Math.max(...values.map((item) => item.amount), 0);
  return values.map((item) => ({
    ...item,
    height: maximum ? Math.max((item.amount / maximum) * 100, item.amount > 0 ? 3 : 0) : 0,
    label: new Date(`${item.date}T12:00:00`).toLocaleDateString('en-KE', { weekday: 'short' }),
  }));
});
const paymentColors: Record<string, string> = {
  CASH: '#0f766e', MPESA: '#2563eb', CARD: '#7c3aed', BANK: '#d97706', CREDIT: '#db2777',
};
const paymentSlices = computed(() => {
  const values = dashboard.value?.paymentMix ?? [];
  const total = values.reduce((sum, item) => sum + item.amount, 0);
  let cursor = 0;
  return values.map((item, index) => {
    const percent = total ? (item.amount / total) * 100 : 0;
    const slice = { ...item, percent, color: paymentColors[item.method] ?? ['#0891b2', '#65a30d', '#ea580c'][index % 3] };
    cursor += percent;
    return slice;
  });
});
const paymentGradient = computed(() => {
  if (!paymentSlices.value.length) return 'conic-gradient(#e5e7eb 0% 100%)';
  let cursor = 0;
  const stops = paymentSlices.value.map((slice: { percent: number; color: string }) => {
    const start = cursor;
    cursor += slice.percent;
    return `${slice.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
});
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <div class="text-sm text-gray-500">Today: {{ new Date().toLocaleDateString() }}</div>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <p class="text-gray-500">Loading...</p>
    </div>

    <template v-else-if="dashboard">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card p-4">
          <h3 class="text-sm font-medium text-gray-600">Today's Sales</h3>
          <p class="text-2xl font-bold text-primary-600">KES {{ (dashboard.today?.sales ?? 0).toLocaleString() }}</p>
          <p class="text-sm text-gray-600">{{ dashboard.today?.transactions ?? 0 }} completed transactions</p>
        </div>
        <div class="card p-4">
          <h3 class="text-sm font-medium text-gray-600">Low Stock Locations</h3>
          <p class="text-2xl font-bold text-red-600">{{ dashboard.inventory?.lowStock ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <h3 class="text-sm font-medium text-gray-600">Out of Stock Locations</h3>
          <p class="text-2xl font-bold text-red-600">{{ dashboard.inventory?.outOfStock ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <h3 class="text-sm font-medium text-gray-600">New Customers Today</h3>
          <p class="text-2xl font-bold text-blue-600">{{ dashboard.today?.customers ?? 0 }}</p>
        </div>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section class="card p-5" aria-labelledby="sales-trend-heading">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div><h2 id="sales-trend-heading" class="font-semibold">Sales trend</h2><p class="text-sm text-muted-foreground">Completed sales over the last seven days</p></div>
            <span class="text-sm font-medium">{{ currency(salesBars.reduce((sum, item) => sum + item.amount, 0)) }}</span>
          </div>
          <div v-if="salesBars.some((item) => item.amount > 0)" class="flex h-44 items-end gap-2 border-b border-l px-2 pb-1 pt-4" role="img" aria-label="Bar chart of completed sales by day for the past seven days">
            <div v-for="item in salesBars" :key="item.date" class="group flex h-full min-w-0 flex-1 flex-col justify-end">
              <div class="mb-1 text-center text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100">{{ currency(item.amount) }}</div>
              <div class="mx-auto w-2/3 rounded-t bg-primary transition-opacity group-hover:opacity-75" :style="{ height: `${item.height}%`, minHeight: item.amount ? '4px' : '0' }" :title="`${item.date}: ${currency(item.amount)}`"></div>
              <span class="mt-2 text-center text-xs text-muted-foreground">{{ item.label }}</span>
            </div>
          </div>
          <div v-else class="flex h-44 items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground">No completed sales in the last seven days.</div>
        </section>

        <section class="card p-5" aria-labelledby="payment-mix-heading">
          <div class="mb-4"><h2 id="payment-mix-heading" class="font-semibold">Payment mix</h2><p class="text-sm text-muted-foreground">Paid transactions over the last seven days</p></div>
          <div v-if="paymentSlices.length" class="flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <div class="relative h-40 w-40 shrink-0 rounded-full" :style="{ background: paymentGradient }" role="img" aria-label="Donut chart of paid sales by payment method">
              <div class="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-card"><span class="text-xs text-muted-foreground">Paid total</span><span class="text-center text-sm font-semibold">{{ currency(paymentSlices.reduce((sum, item) => sum + item.amount, 0)) }}</span></div>
            </div>
            <ul class="min-w-40 space-y-2 text-sm">
              <li v-for="slice in paymentSlices" :key="slice.method" class="flex items-center justify-between gap-4">
                <span class="flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-sm" :style="{ background: slice.color }"></i>{{ slice.method }}</span>
                <span class="text-muted-foreground">{{ slice.percent.toFixed(1) }}% · {{ currency(slice.amount) }}</span>
              </li>
            </ul>
          </div>
          <div v-else class="flex h-40 items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground">No paid transactions in the last seven days.</div>
        </section>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-4">
          <h3 class="font-medium mb-3">Recent Sales</h3>
          <div v-if="!dashboard.recentSales || dashboard.recentSales.length === 0" class="text-gray-500 text-sm">
            No sales yet
          </div>
          <div v-else class="space-y-2">
            <div v-for="s in dashboard.recentSales" :key="s.saleNumber" class="flex justify-between">
              <span class="text-sm">{{ s.customer || 'Walk-in' }} <span class="text-muted-foreground">· {{ s.saleNumber }}</span></span>
              <span class="text-sm font-medium text-gray-900">KES {{ s.amount.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="card p-4">
          <h3 class="font-medium mb-3">Top Products (All Time)</h3>
          <div v-if="!dashboard.topProducts || dashboard.topProducts.length === 0" class="text-gray-500 text-sm">
            No data yet
          </div>
          <div v-else class="space-y-2">
            <div v-for="p in dashboard.topProducts" :key="p.productId" class="flex justify-between">
              <span class="text-sm">{{ p.name }}</span>
              <span class="text-sm text-gray-500">{{ p.quantitySold }} sold</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
