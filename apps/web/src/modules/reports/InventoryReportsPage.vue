<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { exportReportPdf } from './report-export';
import ChartGrid from './components/charts/ChartGrid.vue';
import {
  bucketByDay,
  countBy,
  formatCount,
  groupSum,
  type ChartDatum,
  type ChartSpec,
} from './components/charts/chart-utils';

const types = [
  { value: 'stock', label: 'Current stock', endpoint: '/reports/inventory/stock' },
  { value: 'movements', label: 'Stock movements', endpoint: '/reports/inventory/movements' },
  { value: 'low-stock', label: 'Low stock', endpoint: '/reports/inventory/low-stock' },
  { value: 'out-of-stock', label: 'Out of stock', endpoint: '/reports/inventory/out-of-stock' },
];
const type = ref('stock');
const from = ref('');
const to = ref('');
const result = ref<any>(null);
const loading = ref(false);
const current = computed(() => types.find((item) => item.value === type.value)!);
const rows = computed<any[]>(() => {
  const value = result.value;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
});

async function runReport() {
  loading.value = true;
  try {
    const params: Record<string, string | number> = { page: 1, limit: 100 };
    if (from.value) params.from = from.value;
    if (to.value) params.to = to.value;
    const response = await apiClient.get(current.value.endpoint, { params });
    result.value = response.data.data;
  } catch { notification.error('Could not load this inventory report'); }
  finally { loading.value = false; }
}

function csvCell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function exportCsv() {
  if (!rows.value.length) return;
  const headers = Object.keys(rows.value[0]);
  const csv = [headers.map(csvCell).join(','), ...rows.value.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `inventory-${type.value}.csv`; link.click(); URL.revokeObjectURL(url);
}
// Reload as soon as a different report is picked so the charts and table stay in sync.
watch(type, () => {
  result.value = null;
  void runReport();
});
onMounted(() => {
  void runReport();
});

const totalUnits = computed(() =>
  rows.value.reduce((sum, row) => sum + Number(row.available ?? row.quantity ?? 0), 0),
);

const charts = computed<ChartSpec[]>(() => {
  const list = rows.value;
  const count = (value: number) => formatCount(value);

  if (type.value === 'stock') {
    const byWarehouse = groupSum(list, (row) => row.warehouse, (row) => Number(row.available ?? 0));
    const topProducts: ChartDatum[] = [...list]
      .sort((a, b) => Number(b.available ?? 0) - Number(a.available ?? 0))
      .slice(0, 8)
      .map((row) => ({ label: row.name, value: Number(row.available ?? 0) }));

    return [
      {
        key: 'warehouse',
        title: 'Available units by warehouse',
        description: 'Stock on hand minus reservations',
        meta: `${formatCount(totalUnits.value)} units`,
        kind: 'hbar',
        items: byWarehouse,
        formatter: count,
      },
      {
        key: 'products',
        title: 'Top products by available units',
        description: 'Highest stock cover in the current page',
        kind: 'hbar',
        items: topProducts,
        formatter: count,
      },
    ];
  }

  if (type.value === 'movements') {
    return [
      {
        key: 'movement-types',
        title: 'Movements by type',
        description: 'Share of recorded stock movements',
        meta: `${formatCount(list.length)} records`,
        kind: 'donut',
        items: countBy(list, (row) => row.type),
        formatter: count,
        centerLabel: 'Movements',
      },
      {
        key: 'movement-day',
        title: 'Movement volume by day',
        description: 'Quantity moved per calendar day',
        kind: 'line',
        items: bucketByDay(list, (row) => row.date, (row) => Math.abs(Number(row.quantity ?? 0))),
        formatter: count,
      },
      {
        key: 'movement-value',
        title: 'Quantity by movement type',
        description: 'Total units moved per type',
        kind: 'hbar',
        items: groupSum(list, (row) => row.type, (row) => Math.abs(Number(row.quantity ?? 0))),
        formatter: count,
      },
    ];
  }

  if (type.value === 'low-stock') {
    const lowest: ChartDatum[] = [...list]
      .sort((a, b) => Number(a.quantity ?? 0) - Number(b.quantity ?? 0))
      .slice(0, 8)
      .map((row) => ({ label: row.name, value: Number(row.quantity ?? 0) }));

    return [
      {
        key: 'lowest',
        title: 'Lowest stock on hand',
        description: 'Products closest to running out',
        meta: `${formatCount(list.length)} at risk`,
        kind: 'hbar',
        items: lowest,
        formatter: count,
      },
      {
        key: 'warehouse',
        title: 'Low stock by warehouse',
        description: 'Where replenishment is needed',
        kind: 'donut',
        items: countBy(list, (row) => row.warehouse),
        formatter: count,
        centerLabel: 'Products',
      },
    ];
  }

  return [
    {
      key: 'warehouse',
      title: 'Out-of-stock products by warehouse',
      description: 'Where shelves are empty',
      meta: `${formatCount(list.length)} products`,
      kind: 'donut',
      items: countBy(list, (row) => row.warehouse),
      formatter: count,
      centerLabel: 'Products',
    },
  ];
});

</script>

<template>
  <WorkspaceShell workspace-title="Inventory Reports" workspace-description="Stock levels and movement history">
    <div class="mb-5 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <label class="min-w-48 flex-1 space-y-1 text-sm"><span class="text-muted-foreground">Report</span><select v-model="type" class="w-full rounded-md border bg-background px-3 py-2"><option v-for="item in types" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
      <label class="space-y-1 text-sm"><span class="block text-muted-foreground">From</span><input v-model="from" type="date" class="rounded-md border bg-background px-3 py-2"></label>
      <label class="space-y-1 text-sm"><span class="block text-muted-foreground">To</span><input v-model="to" type="date" class="rounded-md border bg-background px-3 py-2"></label>
      <button class="btn btn-primary" :disabled="loading" @click="runReport">{{ loading ? 'Loading…' : 'Run report' }}</button>
      <button v-if="rows.length" class="btn btn-secondary" @click="exportCsv">Export CSV</button>
      <button v-if="result" class="btn btn-secondary" @click="exportReportPdf(({ stock: 'inventory', movements: 'stock-movements', 'low-stock': 'low-stock', 'out-of-stock': 'out-of-stock' } as Record<string, string>)[type], { from: from || undefined, to: to || undefined, page: 1, limit: 100 }, `inventory-${type}.pdf`)">Export PDF</button>
    </div>
    <ChartGrid v-if="result" :specs="charts" />
    <div v-if="result && rows.length" class="overflow-auto rounded-lg border bg-card">
      <table class="w-full text-left text-sm"><thead class="bg-muted/50"><tr><th v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2 font-medium">{{ key.replaceAll(/([A-Z])/g, ' $1') }}</th></tr></thead>
        <tbody><tr v-for="(row, index) in rows" :key="row.id || row.productId || row.movementId || index" class="border-t"><td v-for="key in Object.keys(rows[0])" :key="key" class="max-w-xs px-3 py-2">{{ typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key] }}</td></tr></tbody></table>
    </div>
    <div v-else-if="result" class="rounded-lg border bg-card p-10 text-center text-muted-foreground">No records found for this report.</div>
  </WorkspaceShell>
</template>
