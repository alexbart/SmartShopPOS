<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';

const queryClient = useQueryClient();
const openingFloat = ref(0);
const closingLoading = ref(false);

const { data: drawerResponse, isLoading } = useQuery({
  queryKey: ['cash-drawer-current'],
  queryFn: async () => {
    const response = await apiClient.get('/cash-drawers/current');
    return response.data.data;
  },
});

const session = computed(() => drawerResponse.value?.session ?? drawerResponse.value);

async function openDrawer() {
  try {
    const response = await apiClient.post('/cash-drawers/open', {
      openingFloat: openingFloat.value,
    });
    if (response.data.success) {
      notification.success('Cash drawer opened');
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-current'] });
    }
  } catch {
    // Handled by API interceptor
  }
}

async function closeDrawer() {
  if (!session.value) return;
  const counted = prompt('Enter counted cash amount:');
  if (!counted) return;

  closingLoading.value = true;
  try {
    const response = await apiClient.post(`/cash-drawers/${session.value.id}/close`, {
      countedCash: Number(counted),
    });
    if (response.data.success) {
      const variance = response.data.data?.variance ?? 0;
      if (Math.abs(variance) > 0.01) {
        notification.warning('Cash drawer closed with variance', `Variance: KES ${Number(variance).toLocaleString()}`);
      } else {
        notification.success('Cash drawer closed');
      }
      queryClient.invalidateQueries({ queryKey: ['cash-drawer-current'] });
    }
  } catch {
    // Handled by API interceptor
  } finally {
    closingLoading.value = false;
  }
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Cash Drawer</h1>
    </div>

    <div v-if="isLoading" class="card p-6 max-w-md animate-pulse">
      <div class="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
      <div class="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
    </div>

    <div v-else-if="!session" class="card p-6 max-w-md">
      <h2 class="font-bold text-lg mb-4">Open Cash Drawer</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Opening Float</label>
        <input v-model.number="openingFloat" type="number" placeholder="Enter opening float amount" class="input" />
      </div>
      <button @click="openDrawer" class="w-full btn btn-primary">Open Drawer</button>
    </div>

    <div v-else class="space-y-6">
      <div class="card p-6">
        <h2 class="font-bold text-lg mb-4">Cash Drawer Summary</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-600">Opening Float</label>
            <p class="text-xl font-bold"><MoneyDisplay :amount="session.openingFloat ?? 0" /></p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Expected Cash</label>
            <p class="text-xl font-bold"><MoneyDisplay :amount="session.expectedCash ?? 0" /></p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Total Sales</label>
            <p class="text-xl font-bold text-green-600"><MoneyDisplay :amount="session.totalSales ?? 0" /></p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Cash In</label>
            <p class="text-xl font-bold"><MoneyDisplay :amount="session.totalCashIn ?? 0" /></p>
          </div>
          <div>
            <label class="text-sm text-gray-600">Cash Out</label>
            <p class="text-xl font-bold text-red-600"><MoneyDisplay :amount="session.totalCashOut ?? 0" /></p>
          </div>
          <div v-if="session.variance !== null && session.variance !== undefined" :class="Number(session.variance) >= 0 ? 'text-green-600' : 'text-red-600'">
            <label class="text-sm text-gray-600">Variance</label>
            <p class="text-xl font-bold"><MoneyDisplay :amount="session.variance ?? 0" /></p>
          </div>
        </div>
        <div class="mt-6">
          <button v-if="session.status === 'OPEN'" @click="closeDrawer" :disabled="closingLoading" class="btn btn-primary">
            {{ closingLoading ? 'Closing...' : 'Close Cash Drawer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>