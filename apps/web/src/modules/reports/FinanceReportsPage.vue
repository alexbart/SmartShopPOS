<script setup lang="ts">
import { ref } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { exportReportPdf } from './report-export';

const reportType = ref('daily-cash-summary');
const from = ref('');
const to = ref('');
const result = ref<any>(null);
const loading = ref(false);

const reportTypes = [
  { value: 'daily-cash-summary', label: 'Daily Cash Summary' },
  { value: 'expense-report', label: 'Expense Report' },
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
    notification.error(e.response?.data?.message || 'Failed to run report');
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  if (!result.value) return;
  const data = Array.isArray(result.value) ? result.value : result.value.data || [];
  const rows = data.length ? data : [result.value];
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers.map(cell).join(','), ...rows.map((row: any) => headers.map((h: string) => cell(row[h])).join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${reportType.value}.csv`;
  link.click(); URL.revokeObjectURL(link.href);
}
</script>

<template>
  <WorkspaceShell workspace-title="Finance Reports" workspace-description="Cash, expense, reconciliation, and payment reports">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Finance Reports</h1>
      <button v-if="result" @click="exportCsv" class="btn btn-secondary">Export CSV</button>
    </div>

    <div class="card p-6 max-w-2xl space-y-4 mb-6">
      <select v-model="reportType" class="input">
        <option v-for="r in reportTypes" :key="r.value" :value="r.value">{{ r.label }}</option>
      </select>
      <div class="grid grid-cols-2 gap-4">
        <label class="space-y-1 text-sm"><span class="text-muted-foreground">From</span><input v-model="from" type="date" class="input" /></label>
        <label class="space-y-1 text-sm"><span class="text-muted-foreground">To</span><input v-model="to" type="date" class="input" /></label>
      </div>
      <button @click="runReport" :disabled="loading" class="btn btn-primary">
        {{ loading ? 'Running...' : 'Run Report' }}
      </button>
      <button v-if="result" @click="exportReportPdf(reportType, { from: from || undefined, to: to || undefined }, `${reportType}.pdf`)" class="btn btn-secondary">Export PDF</button>
    </div>

    <div v-if="result" class="card overflow-auto p-4">
      <table v-if="(Array.isArray(result) ? result : result.data || []).length" class="w-full text-left text-sm"><thead><tr><th v-for="key in Object.keys((Array.isArray(result) ? result : result.data)[0])" :key="key" class="px-3 py-2">{{ key }}</th></tr></thead><tbody><tr v-for="(row, index) in (Array.isArray(result) ? result : result.data)" :key="index" class="border-t"><td v-for="key in Object.keys(row)" :key="key" class="px-3 py-2">{{ typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key] }}</td></tr></tbody></table>
      <pre v-else class="text-xs overflow-auto">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </WorkspaceShell>
</template>
