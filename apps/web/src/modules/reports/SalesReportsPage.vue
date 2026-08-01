<script setup lang="ts">
import { ref } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';

const dateRange = ref({ from: '', to: '' });
const exporting = ref(false);

async function exportReport() {
  if (!dateRange.value.from || !dateRange.value.to) {
    notification.error('Please select a date range');
    return;
  }
  exporting.value = true;
  notification.info('Export started');
  try {
    const response = await apiClient.get('/reports/sales', {
      params: { from: dateRange.value.from, to: dateRange.value.to },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange.value.from}-to-${dateRange.value.to}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
    notification.success('Report exported');
  } catch {
    // Handled by API interceptor
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Sales Reports</h1>

    <div class="card p-6 max-w-md">
      <h2 class="font-bold text-lg mb-4">Export Sales Report</h2>
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input v-model="dateRange.from" type="date" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input v-model="dateRange.to" type="date" class="input" />
        </div>
      </div>

      <button
        @click="exportReport"
        :disabled="exporting"
        class="mt-4 btn btn-primary w-full"
      >
        {{ exporting ? 'Exporting...' : 'Export Report' }}
      </button>
    </div>
  </div>
</template>
