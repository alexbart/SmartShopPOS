<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import StatusBadge from '@/components/business/StatusBadge.vue';
import type { PurchaseOrder } from '@/shared/types';

const queryClient = useQueryClient();

const { data: poResponse, isLoading, error: poError } = useQuery({
  queryKey: ['purchase-orders'],
  queryFn: async () => {
    const response = await apiClient.get('/purchase-orders');
    return response.data.data;
  },
});

const pos = computed(() => {
  if (!poResponse.value) return [];
  if (Array.isArray(poResponse.value)) return poResponse.value as PurchaseOrder[];
  return poResponse.value.items ?? [];
});
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Purchase Orders</h1>
    </div>

    <div v-if="isLoading" class="card overflow-hidden">
      <div class="p-4 space-y-3" v-for="i in 5" :key="i">
        <div class="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>

    <div v-else-if="poError" class="text-center py-8 text-gray-500">
      Failed to load purchase orders.
    </div>

    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-muted">
            <th class="text-left p-3 text-xs font-medium text-muted-foreground">#</th>
            <th class="text-left p-3 text-xs font-medium text-muted-foreground">Supplier</th>
            <th class="text-right p-3 text-xs font-medium text-muted-foreground">Total</th>
            <th class="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
            <th class="text-left p-3 text-xs font-medium text-muted-foreground">Expected</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="po in pos" :key="po.id" class="border-t">
            <td class="p-3">
              <div class="font-medium">{{ po.orderNumber }}</div>
            </td>
            <td class="p-3">{{ po.supplier?.name || 'N/A' }}</td>
            <td class="p-3 text-right">KES {{ po.total?.toLocaleString() ?? 0 }}</td>
            <td class="p-3">
              <StatusBadge :status="po.status" />
            </td>
            <td class="p-3 text-sm">{{ po.expectedDeliveryDate?.split('T')[0] }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="pos.length === 0" class="p-4 text-center text-gray-500">
        No purchase orders found.
      </div>
    </div>
  </div>
</template>