<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';

const queryClient = useQueryClient();

const { data: pendingResponse, isLoading } = useQuery({
  queryKey: ['pending-approvals'],
  queryFn: async () => {
    const response = await apiClient.get('/workflow/pending');
    return response.data.data;
  },
});

const pending = computed(() => pendingResponse.value ?? []);

async function approve(id: string) {
  try {
    const response = await apiClient.post(`/workflow/${id}/approve`, { comments: 'Approved via UI' });
    if (response.data.success) {
      notification.success('Approval granted');
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    }
  } catch {
    // Handled by API interceptor
  }
}

async function reject(id: string) {
  const comment = prompt('Rejection reason:');
  if (!comment) return;
  try {
    const response = await apiClient.post(`/workflow/${id}/reject`, { comments: comment });
    if (response.data.success) {
      notification.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    }
  } catch {
    // Handled by API interceptor
  }
}

function refresh() {
  window.location.reload();
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Pending Approvals</h1>
      <button @click="refresh" class="btn btn-secondary">Refresh</button>
    </div>

    <div v-if="isLoading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left p-3 text-xs font-medium text-gray-600">Type</th>
            <th class="text-left p-3 text-xs font-medium text-gray-600">Entity</th>
            <th class="text-right p-3 text-xs font-medium text-gray-600">Amount</th>
            <th class="text-left p-3 text-xs font-medium text-gray-600">Status</th>
            <th class="text-right p-3 text-xs font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in pending" :key="req.id" class="border-t">
            <td class="p-3">{{ req.action }}</td>
            <td class="p-3">{{ req.entityType }} #{{ req.entityId?.slice(0, 8) }}</td>
            <td class="p-3 text-right">KES {{ req.amount }}</td>
            <td class="p-3">
              <span class="badge bg-yellow-100 text-yellow-800">{{ req.status }}</span>
            </td>
            <td class="p-3 flex gap-2 justify-end">
              <button @click="approve(req.id)" class="btn btn-secondary text-xs">Approve</button>
              <button @click="reject(req.id)" class="btn btn-secondary text-xs">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="pending.length === 0" class="p-4 text-center text-gray-500">
        No pending approvals
      </div>
    </div>
  </div>
</template>
