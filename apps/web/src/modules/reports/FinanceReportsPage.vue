<script setup lang="ts">
import { ref } from 'vue';
import { apiClient } from '@/shared/lib/api-client';

const reportType = ref('daily-cash-summary');
const from = ref('');
const to = ref('');
const result = ref<any>(null);
const loading = ref(false);

const reportTypes = [
  { value: 'daily-cash-summary', label: 'Daily Cash Summary' },
  { value: 'expense-report', label: 'Expense Report' },
  { value: 'profit-summary', label: 'Profit Summary' },
  { value: 'cash-drawer-variance', label: 'Cash Drawer Variance' },
  { value: 'sales-by-payment-method', label: 'Sales by Payment Method' },
];

async function runReport() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (from.value) params.append('from', from.value);
    if (to.value) params.append('to', to.value);

    const response = await apiClient.get(`/reports/finance/${reportType.value}`, { params });
    result.value = response.data.data;
  } catch (e: any) {
    alert(e.response?.data?.message || 'Failed to run report');
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  if (!result.value) return;
  const data = Array.isArray(result.value) ? result.value : result.value.data || [];
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map((row: any) => headers.map((h: string) => row[h]).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${reportType.value}.csv`;
  link.click();
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Finance Reports</h1>
      <button v-if="result" @click="exportCsv" class="btn btn-secondary">Export CSV</button>
    </div>

    <div class="card p-6 max-w-2xl space-y-4 mb-6">
      <select v-model="reportType" class="input">
        <option v-for="r in reportTypes" :key="r.value" :value="r.value">{{ r.label }}</option>
      </select>
      <div class="grid grid-cols-2 gap-4">
        <input v-model="from" type="date" class="input" />
        <input v-model="to" type="date" class="input" />
      </div>
      <button @click="runReport" :disabled="loading" class="btn btn-primary">
        {{ loading ? 'Running...' : 'Run Report' }}
      </button>
    </div>

    <div v-if="result" class="card p-4">
      <pre class="text-xs overflow-auto">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>
