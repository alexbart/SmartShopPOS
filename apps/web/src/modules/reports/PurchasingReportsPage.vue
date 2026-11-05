<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { exportReportPdf } from './report-export';
import ChartGrid from './components/charts/ChartGrid.vue';
import {
  countBy,
  formatCount,
  formatCurrency,
  groupSum,
  type ChartDatum,
  type ChartSpec,
} from './components/charts/chart-utils';

const types = [
  { value: 'purchases', label: 'Purchase summary', endpoint: '/reports/purchases' },
  { value: 'outstanding-orders', label: 'Outstanding orders', endpoint: '/reports/purchases/outstanding-orders' },
  { value: 'late-deliveries', label: 'Late deliveries', endpoint: '/reports/purchases/late-deliveries' },
  { value: 'top-suppliers', label: 'Top suppliers', endpoint: '/reports/purchases/top-suppliers' },
];
const type = ref('purchases'); const from = ref(''); const to = ref(''); const result = ref<any>(null); const loading = ref(false);
const current = computed(() => types.find((item) => item.value === type.value)!);
const rows = computed<any[]>(() => Array.isArray(result.value) ? result.value : result.value?.items ?? result.value?.data ?? []);
async function runReport() {
  loading.value = true;
  try {
    const params: Record<string, string | number> = { page: 1, limit: 100 };
    if (from.value) params.from = `${from.value}T00:00:00.000Z`;
    if (to.value) params.to = `${to.value}T23:59:59.999Z`;
    const response = await apiClient.get(current.value.endpoint, { params }); result.value = response.data.data;
  } catch { notification.error('Could not load this purchasing report'); }
  finally { loading.value = false; }
}
function exportCsv() {
  if (!rows.value.length) return;
  const headers = Object.keys(rows.value[0]); const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers.map(cell).join(','), ...rows.value.map((row) => headers.map((key) => cell(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `purchasing-${type.value}.csv`; link.click(); URL.revokeObjectURL(url);
}
// Reload as soon as a different report is picked so the charts and table stay in sync.
watch(type, () => {
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

  if (type.value === 'purchases') {
    const supplierSpend = groupSum(list, (row) => row.supplier, (row) => Number(row.total ?? 0));
    const orderValue = supplierSpend.reduce((sum, item) => sum + item.value, 0);

    return [
      {
        key: 'supplier-spend',
        title: 'Spend by supplier',
        description: 'Ordered value in the selected period',
        meta: `Total ${formatCurrency(orderValue)}`,
        kind: 'hbar',
        items: supplierSpend,
        formatter: money,
      },
      {
        key: 'status',
        title: 'Orders by status',
        description: 'Pipeline split across order states',
        kind: 'donut',
        items: countBy(list, (row) => row.status),
        formatter: count,
        centerLabel: 'Orders',
      },
    ];
  }

  if (type.value === 'outstanding-orders') {
    const pending = groupSum(list, (row) => row.supplier, (row) => Number(row.pendingAmount ?? 0));
    const pendingValue = pending.reduce((sum, item) => sum + item.value, 0);

    return [
      {
        key: 'pending-value',
        title: 'Pending value by supplier',
        description: 'Order value still awaiting delivery',
        meta: `Outstanding ${formatCurrency(pendingValue)}`,
        kind: 'hbar',
        items: pending,
        formatter: money,
      },
      {
        key: 'pending-orders',
        title: 'Open orders by supplier',
        description: 'Number of orders not yet received',
        kind: 'donut',
        items: countBy(list, (row) => row.supplier),
        formatter: count,
        centerLabel: 'Orders',
      },
    ];
  }

  if (type.value === 'late-deliveries') {
    const byOrder: ChartDatum[] = [...list]
      .sort((a, b) => Number(b.daysLate ?? 0) - Number(a.daysLate ?? 0))
      .slice(0, 8)
      .map((row) => ({ label: row.orderNumber, value: Number(row.daysLate ?? 0) }));
    const valueAtRisk = groupSum(list, (row) => row.supplier, (row) => Number(row.total ?? 0));

    return [
      {
        key: 'days-late',
        title: 'Days late by order',
        description: 'Most overdue purchase orders',
        meta: `${formatCount(list.length)} late`,
        kind: 'hbar',
        items: byOrder,
        formatter: (value) => `${formatCount(value)} d`,
      },
      {
        key: 'value-at-risk',
        title: 'Value at risk by supplier',
        description: 'Order value tied up in late deliveries',
        kind: 'hbar',
        items: valueAtRisk,
        formatter: money,
      },
    ];
  }

  const topSuppliers: ChartDatum[] = [...list]
    .sort((a, b) => Number(b.totalSpent ?? 0) - Number(a.totalSpent ?? 0))
    .slice(0, 10)
    .map((row) => ({ label: row.supplier, value: Number(row.totalSpent ?? 0) }));
  const topValue = topSuppliers.reduce((sum, item) => sum + item.value, 0);

  return [
    {
      key: 'top-suppliers',
      title: 'Total spend by supplier',
      description: 'Highest value trading partners',
      meta: `Top ${formatCurrency(topValue)}`,
      kind: 'hbar',
      items: topSuppliers,
      formatter: money,
    },
    {
      key: 'order-count',
      title: 'Orders placed per supplier',
      description: 'Purchase frequency for the same suppliers',
      kind: 'bar',
      items: list
        .slice(0, 10)
        .map((row) => ({ label: row.supplier, value: Number(row.orderCount ?? 0) })),
      formatter: count,
    },
  ];
});

</script>
<template>
  <WorkspaceShell workspace-title="Purchasing Reports" workspace-description="Orders, suppliers, and delivery performance">
    <div class="mb-5 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <label class="min-w-48 flex-1 space-y-1 text-sm"><span class="text-muted-foreground">Report</span><select v-model="type" class="w-full rounded-md border bg-background px-3 py-2"><option v-for="item in types" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
      <label class="space-y-1 text-sm"><span class="block text-muted-foreground">From</span><input v-model="from" type="date" class="rounded-md border bg-background px-3 py-2"></label><label class="space-y-1 text-sm"><span class="block text-muted-foreground">To</span><input v-model="to" type="date" class="rounded-md border bg-background px-3 py-2"></label>
      <button class="btn btn-primary" :disabled="loading" @click="runReport">{{ loading ? 'Loading…' : 'Run report' }}</button><button v-if="rows.length" class="btn btn-secondary" @click="exportCsv">Export CSV</button><button v-if="result" class="btn btn-secondary" @click="exportReportPdf(type, { from: from ? `${from}T00:00:00.000Z` : undefined, to: to ? `${to}T23:59:59.999Z` : undefined, page: 1, limit: 100 }, `purchasing-${type}.pdf`)">Export PDF</button>
    </div>
    <ChartGrid v-if="result" :specs="charts" />
    <div v-if="result && rows.length" class="overflow-auto rounded-lg border bg-card"><table class="w-full text-left text-sm"><thead class="bg-muted/50"><tr><th v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2">{{ key.replaceAll(/([A-Z])/g, ' $1') }}</th></tr></thead><tbody><tr v-for="(row, index) in rows" :key="index" class="border-t"><td v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2">{{ row[key] }}</td></tr></tbody></table></div>
    <div v-else-if="result" class="rounded-lg border bg-card p-10 text-center text-muted-foreground">No records found for this report.</div>
  </WorkspaceShell>
</template>
