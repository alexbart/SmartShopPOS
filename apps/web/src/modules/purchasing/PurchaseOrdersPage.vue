<script setup lang="ts">
import { ref, computed } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { useQuery } from '@tanstack/vue-query';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: { name: string };
  status: string;
  total: number;
  expectedDeliveryDate: string | null;
}

const { data: poResponse, isLoading } = useQuery({
  queryKey: ['purchase-orders'],
  queryFn: async () => {
    const response = await apiClient.get('/purchase-orders');
    return response.data.data;
  },
});

const pos = computed(() => poResponse.value?.items ?? poResponse.value ?? []);
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Purchase Orders</h1>
      <button @click="$router.push('/purchase-orders/create')" class="btn btn-primary">Create PO</button>
    </div>

    <div v-if="isLoading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left p-3 text-xs font-medium text-gray-600">#</th>
            <th class="text-left p-3 text-xs font-medium text-gray-600">Supplier</th>
            <th class="text-right p-3 text-xs font-medium text-gray-600">Total</th>
            <th class="text-left p-3 text-xs font-medium text-gray-600">Status</th>
            <th class="text-left p-3 text-xs font-medium text-gray-600">Expected</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="po in pos" :key="po.id" class="border-t">
            <td class="p-3">{{ po.orderNumber }}</td>
            <td class="p-3">{{ po.supplier?.name || 'N/A' }}</td>
            <td class="p-3 text-right">KES {{ po.total?.toLocaleString() }}</td>
            <td class="p-3">
              <span class="badge bg-gray-100 text-gray-800">{{ po.status }}</span>
            </td>
            <td class="p-3">{{ po.expectedDeliveryDate?.split('T')[0] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
