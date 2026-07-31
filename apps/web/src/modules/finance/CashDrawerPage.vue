<script setup lang="ts">
import { ref, computed } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { useQuery } from '@tanstack/vue-query';

interface CashDrawerSession {
  id: string;
  status: string;
  openingFloat: number;
  expectedCash: number;
  countedCash: number | null;
  variance: number | null;
  totalSales: number;
  totalCashIn: number;
  totalCashOut: number;
}

const { data: drawerResponse } = useQuery({
  queryKey: ['cash-drawer-current'],
  queryFn: async () => {
    const response = await apiClient.get('/cash-drawers/current');
    return response.data.data;
  },
});

const session = computed(() => drawerResponse.value?.session);

const openingFloat = ref(0);

async function openDrawer() {
  try {
    await apiClient.post('/cash-drawers/open', {
      openingFloat: openingFloat.value,
    });
    alert('Cash drawer opened!');
  } catch (e: any) {
    alert(e.response?.data?.message || 'Failed to open drawer');
  }
}

async function closeDrawer() {
  if (!session.value) return;
  const counted = prompt('Enter counted cash amount:');
  if (!counted) return;

  try {
    await apiClient.post(`/cash-drawers/${session.value.id}/close`, {
      countedCash: Number(counted),
    });
    alert('Cash drawer closed!');
  } catch (e: any) {
    alert(e.response?.data?.message || 'Failed to close drawer');
  }
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Cash Drawer</h1>
    </div>

    <div v-if="!session" class="card p-6 max-w-md">
      <h2 class="font-bold text-lg mb-4">Open Cash Drawer</h2>
      <input v-model.number="openingFloat" type="number" placeholder="Opening Float Amount" class="input mb-4" />
      <button @click="openDrawer" class="w-full btn btn-primary">Open Drawer</button>
    </div>

    <div v-else class="space-y-6">
      <div class="card p-6">
        <h2 class="font-bold text-lg mb-4">Cash Drawer Summary</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-600">Opening Float</label>
            <p class="text-xl font-bold">KES {{ session.openingFloat?.toLocaleString() }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Expected Cash</label>
            <p class="text-xl font-bold">KES {{ session.expectedCash?.toLocaleString() }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Total Sales</label>
            <p class="text-xl font-bold text-green-600">KES {{ session.totalSales?.toLocaleString() }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Cash In</label>
            <p class="text-xl font-bold">KES {{ session.totalCashIn?.toLocaleString() }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Cash Out</label>
            <p class="text-xl font-bold text-red-600">KES {{ session.totalCashOut?.toLocaleString() }}</p>
          </div>
          <div v-if="session.variance !== null" :class="session.variance >= 0 ? 'text-green-600' : 'text-red-600'">
            <label class="text-sm text-gray-600">Variance</label>
            <p class="text-xl font-bold">KES {{ session.variance?.toLocaleString() }}</p>
          </div>
        </div>

        <div class="mt-6">
          <button v-if="session.status === 'OPEN'" @click="closeDrawer" class="btn btn-primary">
            Close Cash Drawer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
