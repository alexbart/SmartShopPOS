<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { exportReportPdf } from './report-export';
import ChartGrid from './components/charts/ChartGrid.vue';
import {
  bucketByDay,
  formatCount,
  formatCurrency,
  groupSum,
  type ChartSpec,
} from './components/charts/chart-utils';

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

const rows = computed<any[]>(() => {
  const value = result.value;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
});

// Reload as soon as a different report is picked so the charts and table stay in sync.
watch(reportType, () => {
  result.value = null;
  void runReport();
});
onMounted(() => {
  void runReport();
});

const charts = computed<ChartSpec[]>(() => {
  const list = rows.value;
  const money = (value: number) => formatCurrency(value);
  const count = (value: number) => formatCount(value);
  const varianceItems = list.map((row) => ({
    label: row.date,
    value: Number(row.variance ?? 0),
  }));

  if (reportType.value === 'daily-cash-summary') {
    const cashTotal = list.reduce((sum, row) => sum + Number(row.cashSales ?? 0), 0);

    return [
      {
        key: 'cash-sales',
        title: 'Cash sales by day',
        description: 'Tender value recorded per drawer session',
        meta: `Total ${formatCurrency(cashTotal)}`,
        kind: 'line',
        items: bucketByDay(list, (row) => row.date, (row) => Number(row.cashSales ?? 0)),
        formatter: money,
      },
      {
        key: 'variance',
        title: 'Drawer variance by day',
        description: 'Negative values mean a cash shortage',
        kind: 'hbar',
        items: varianceItems,
        formatter: money,
      },
    ];
  }

  if (reportType.value === 'expense-report') {
    const expenseTotal = list.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    return [
      {
        key: 'categories',
        title: 'Expenses by category',
        description: 'Where the money is going',
        meta: `Total ${formatCurrency(expenseTotal)}`,
        kind: 'donut',
        items: groupSum(list, (row) => row.categoryName, (row) => Number(row.amount ?? 0)),
        formatter: money,
        centerLabel: 'Spent',
      },
      {
        key: 'daily',
        title: 'Expenses by day',
        description: 'Spending trend across the period',
        kind: 'line',
        items: bucketByDay(list, (row) => row.date, (row) => Number(row.amount ?? 0)),
        formatter: money,
      },
    ];
  }

  if (reportType.value === 'cash-drawer-variance') {
    return [
      {
        key: 'variance',
        title: 'Drawer variance by day',
        description: 'Counted cash minus expected cash',
        meta: `${formatCount(list.length)} sessions`,
        kind: 'hbar',
        items: varianceItems,
        formatter: money,
      },
      {
        key: 'expected',
        title: 'Expected cash by day',
        description: 'Closing expectation per session',
        kind: 'line',
        items: bucketByDay(list, (row) => row.date, (row) => Number(row.expectedCash ?? 0)),
        formatter: money,
      },
    ];
  }

  return [
    {
      key: 'methods',
      title: 'Amount by payment method',
      description: 'Share of value taken per tender',
      kind: 'donut',
      items: groupSum(list, (row) => row.paymentMethod, (row) => Number(row.amount ?? 0)),
      formatter: money,
      centerLabel: 'Collected',
    },
    {
      key: 'daily',
      title: 'Collected value by day',
      description: 'Daily payment totals across methods',
      kind: 'line',
      items: bucketByDay(list, (row) => row.date, (row) => Number(row.amount ?? 0)),
      formatter: money,
    },
    {
      key: 'counts',
      title: 'Transactions by payment method',
      description: 'How often each tender is used',
      kind: 'bar',
      items: groupSum(list, (row) => row.paymentMethod, (row) => Number(row.count ?? 0)),
      formatter: count,
    },
  ];
});

function exportCsv() {
  if (!result.value) return;
  const data = Array.isArray(result.value) ? result.value : result.value.data || [];
  const dataRows = data.length ? data : [result.value];
  if (!dataRows.length) return;
  const headers = Object.keys(dataRows[0]);
  const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers.map(cell).join(','), ...dataRows.map((row: any) => headers.map((h: string) => cell(row[h])).join(','))].join('\r\n');
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

    <ChartGrid v-if="result" :specs="charts" />

    <div v-if="result" class="card overflow-auto p-4">
      <table v-if="(Array.isArray(result) ? result : result.data || []).length" class="w-full text-left text-sm"><thead><tr><th v-for="key in Object.keys((Array.isArray(result) ? result : result.data)[0])" :key="key" class="px-3 py-2">{{ key }}</th></tr></thead><tbody><tr v-for="(row, index) in (Array.isArray(result) ? result : result.data)" :key="index" class="border-t"><td v-for="key in Object.keys(row)" :key="key" class="px-3 py-2">{{ typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key] }}</td></tr></tbody></table>
      <pre v-else class="text-xs overflow-auto">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </WorkspaceShell>
</template>
