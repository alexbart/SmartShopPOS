<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';

interface DashboardData {
  today: {
    sales: number;
    transactions: number;
    customers: number;
  };
  inventory: {
    lowStock: number;
    outOfStock: number;
  };
  topProducts: Array<{ id: string; name: string; salesCount: number }>;
  recentSales: Array<{ id: string; saleNumber: string; total: number; customerName?: string }>;
}

const { data: dashboard, isLoading } = useQuery({
  queryKey: ['dashboard'],
  queryFn: async () => {
    const response = await apiClient.get<DashboardData>('/dashboard');
    return response.data.data;
  },
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
          <p class="text-2xl font-bold text-primary-600">{{ dashboard.today?.transactions ?? 0 }}</p>
          <p class="text-lg text-gray-900">KES {{ (dashboard.today?.sales ?? 0).toLocaleString() }}</p>
        </div>
        <div class="card p-4">
          <h3 class="text-sm font-medium text-gray-600">Low Stock Items</h3>
          <p class="text-2xl font-bold text-red-600">{{ dashboard.inventory?.lowStock ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <h3 class="text-sm font-medium text-gray-600">Out of Stock</h3>
          <p class="text-2xl font-bold text-red-600">{{ dashboard.inventory?.outOfStock ?? 0 }}</p>
        </div>
        <div class="card p-4">
          <h3 class="text-sm font-medium text-gray-600">Recent Sales</h3>
          <p class="text-2xl font-bold text-blue-600">{{ dashboard.recentSales?.length ?? 0 }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-4">
          <h3 class="font-medium mb-3">Recent Sales</h3>
          <div v-if="!dashboard.recentSales || dashboard.recentSales.length === 0" class="text-gray-500 text-sm">
            No sales yet
          </div>
          <div v-else class="space-y-2">
            <div v-for="s in dashboard.recentSales" :key="s.id" class="flex justify-between">
              <span class="text-sm">{{ s.customerName || 'Walk-in' }}</span>
              <span class="text-sm font-medium text-gray-900">KES {{ s.total.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="card p-4">
          <h3 class="font-medium mb-3">Top Products</h3>
          <div v-if="!dashboard.topProducts || dashboard.topProducts.length === 0" class="text-gray-500 text-sm">
            No data yet
          </div>
          <div v-else class="space-y-2">
            <div v-for="p in dashboard.topProducts" :key="p.id" class="flex justify-between">
              <span class="text-sm">{{ p.name }}</span>
              <span class="text-sm text-gray-500">{{ p.salesCount }} sold</span>
            </div>
          </div>
  </div>
</div>
</template>

  </div>
</template>
