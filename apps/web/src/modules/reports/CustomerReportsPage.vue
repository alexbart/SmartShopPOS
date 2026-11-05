<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { exportReportPdf } from './report-export';
import ChartGrid from './components/charts/ChartGrid.vue';
import {
  formatCount,
  formatCurrency,
  topWithOther,
  type ChartDatum,
  type ChartSpec,
} from './components/charts/chart-utils';

const types = [
  { value: 'customers', label: 'Customer summary', endpoint: '/reports/customers' },
  { value: 'top', label: 'Top customers', endpoint: '/reports/customers/top' },
];
const type = ref('customers'); const result = ref<any>(null); const loading = ref(false); const search = ref('');
const current = computed(() => types.find((item) => item.value === type.value)!);
const rows = computed<any[]>(() => Array.isArray(result.value) ? result.value : result.value?.items ?? []);
async function runReport() {
  loading.value = true;
  try { const params: Record<string, string | number> = { page: 1, limit: 100 }; if (search.value) params.search = search.value; const response = await apiClient.get(current.value.endpoint, { params }); result.value = response.data.data; }
  catch { notification.error('Could not load this customer report'); }
  finally { loading.value = false; }
}
function exportCsv() {
  if (!rows.value.length) return;
  const headers = Object.keys(rows.value[0]); const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers.map(cell).join(','), ...rows.value.map((row) => headers.map((key) => cell(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `customers-${type.value}.csv`; link.click(); URL.revokeObjectURL(url);
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
  const spend: ChartDatum[] = topWithOther(
    rows.value.map((row) => ({ label: row.name, value: Number(row.totalSpent ?? 0) })),
    8,
  );
  const transactions: ChartDatum[] = topWithOther(
    rows.value.map((row) => ({ label: row.name, value: Number(row.transactions ?? 0) })),
    8,
  );
  const spendTotal = rows.value.reduce((sum, row) => sum + Number(row.totalSpent ?? 0), 0);
  const basketAverage = rows.value.length ? spendTotal / rows.value.length : 0;

  const specs: ChartSpec[] = [
    {
      key: 'spend',
      title: 'Lifetime value by customer',
      description: 'Top customers ranked by total spend',
      meta: `Total ${formatCurrency(spendTotal)}`,
      kind: 'hbar',
      items: spend,
      formatter: (value) => formatCurrency(value),
    },
    {
      key: 'transactions',
      title: 'Transactions by customer',
      description: 'Purchase frequency across the same customers',
      kind: 'hbar',
      items: transactions,
      formatter: (value) => formatCount(value),
    },
  ];

  // The "top customers" endpoint omits the per-sale average, so only chart it when present.
  if (rows.value.some((row) => row.averageSale !== undefined)) {
    specs.push({
      key: 'average',
      title: 'Average spend by customer',
      description: `Average basket of ${formatCurrency(basketAverage)}`,
      kind: 'bar',
      items: topWithOther(
        rows.value.map((row) => ({
          label: row.name,
          value: Number(row.averageSale ?? 0),
        })),
        10,
      ),
      formatter: (value) => formatCurrency(value),
    });
  }

  return specs;
});

</script>
<template>
  <WorkspaceShell workspace-title="Customer Reports" workspace-description="Customer purchasing and engagement summaries">
    <div class="mb-5 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <label class="min-w-48 flex-1 space-y-1 text-sm"><span class="text-muted-foreground">Report</span><select v-model="type" class="w-full rounded-md border bg-background px-3 py-2"><option v-for="item in types" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
      <label v-if="type === 'customers'" class="min-w-48 flex-1 space-y-1 text-sm"><span class="text-muted-foreground">Search customers</span><input v-model="search" class="w-full rounded-md border bg-background px-3 py-2" placeholder="Name or code"></label>
      <button class="btn btn-primary" :disabled="loading" @click="runReport">{{ loading ? 'Loading…' : 'Run report' }}</button><button v-if="rows.length" class="btn btn-secondary" @click="exportCsv">Export CSV</button><button v-if="result" class="btn btn-secondary" @click="exportReportPdf(type === 'top' ? 'top-customers' : 'customers', { search: search || undefined, page: 1, limit: 100 }, `customers-${type}.pdf`)">Export PDF</button>
    </div>
    <ChartGrid v-if="result" :specs="charts" />
    <div v-if="result && rows.length" class="overflow-auto rounded-lg border bg-card"><table class="w-full text-left text-sm"><thead class="bg-muted/50"><tr><th v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2">{{ key.replaceAll(/([A-Z])/g, ' $1') }}</th></tr></thead><tbody><tr v-for="(row, index) in rows" :key="row.customerId || index" class="border-t"><td v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2">{{ row[key] }}</td></tr></tbody></table></div>
    <div v-else-if="result" class="rounded-lg border bg-card p-10 text-center text-muted-foreground">No records found for this report.</div>
  </WorkspaceShell>
</template>
