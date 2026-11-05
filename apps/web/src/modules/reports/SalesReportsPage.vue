<script setup lang="ts">
import { computed, ref } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { exportReportPdf } from './report-export';

const from = ref(''); const to = ref(''); const status = ref('');
const report = ref<any>(null); const loading = ref(false);
const rows = computed<any[]>(() => report.value?.items ?? []);
async function runReport() {
  loading.value = true;
  try {
    const params: Record<string, string | number> = { page: 1, limit: 100 };
    if (from.value) params.from = `${from.value}T00:00:00.000Z`;
    if (to.value) params.to = `${to.value}T23:59:59.999Z`;
    if (status.value) params.status = status.value;
    const response = await apiClient.get('/reports/sales', { params });
    report.value = response.data.data;
  } catch { notification.error('Could not load the sales report'); }
  finally { loading.value = false; }
}
function csvCell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function exportCsv() {
  if (!rows.value.length) return;
  const headers = Object.keys(rows.value[0]);
  const csv = [headers.map(csvCell).join(','), ...rows.value.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'sales-report.csv'; link.click(); URL.revokeObjectURL(url);
}
const currency = (value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value ?? 0);
</script>

<template>
  <WorkspaceShell workspace-title="Sales Reports" workspace-description="Sales performance and tender summaries">
    <div class="mb-5 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <label class="space-y-1 text-sm"><span class="block text-muted-foreground">From</span><input v-model="from" type="date" class="rounded-md border bg-background px-3 py-2"></label>
      <label class="space-y-1 text-sm"><span class="block text-muted-foreground">To</span><input v-model="to" type="date" class="rounded-md border bg-background px-3 py-2"></label>
      <label class="space-y-1 text-sm"><span class="block text-muted-foreground">Sale status</span><select v-model="status" class="rounded-md border bg-background px-3 py-2"><option value="">All statuses</option><option>COMPLETED</option><option>PENDING</option><option>VOIDED</option><option>REFUNDED</option></select></label>
      <button class="btn btn-primary" :disabled="loading" @click="runReport">{{ loading ? 'Loading…' : 'Run report' }}</button>
      <button v-if="rows.length" class="btn btn-secondary" @click="exportCsv">Export CSV</button>
      <button v-if="report" class="btn btn-secondary" @click="exportReportPdf('sales', { from: from ? `${from}T00:00:00.000Z` : undefined, to: to ? `${to}T23:59:59.999Z` : undefined, status: status || undefined, page: 1, limit: 100 }, 'sales-report.pdf')">Export PDF</button>
    </div>
    <template v-if="report">
      <div class="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="card in [{ label: 'Sales', value: report.summary?.sales ?? 0 }, { label: 'Gross revenue', value: currency(report.summary?.grossRevenue) }, { label: 'Discounts', value: currency(report.summary?.discounts) }, { label: 'Tax', value: currency(report.summary?.tax) }]" :key="card.label" class="rounded-lg border bg-card p-4"><p class="text-sm text-muted-foreground">{{ card.label }}</p><p class="mt-1 text-xl font-semibold">{{ card.value }}</p></div>
      </div>
      <div class="mb-5 flex flex-wrap gap-3 text-sm"><span v-for="(amount, method) in report.payments" :key="method" class="rounded-full border px-3 py-1">{{ method }}: {{ currency(amount) }}</span></div>
      <div v-if="rows.length" class="overflow-auto rounded-lg border bg-card"><table class="w-full text-left text-sm"><thead class="bg-muted/50"><tr><th v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2">{{ key }}</th></tr></thead><tbody><tr v-for="(row, index) in rows" :key="index" class="border-t"><td v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2">{{ key === 'total' ? currency(row[key]) : row[key] }}</td></tr></tbody></table></div>
      <p v-else class="rounded-lg border bg-card p-10 text-center text-muted-foreground">No sales match these filters.</p>
      <p class="mt-2 text-xs text-muted-foreground">Showing {{ rows.length }} of {{ report.pagination?.total ?? rows.length }} records. Export includes the rows currently loaded.</p>
    </template>
  </WorkspaceShell>
</template>
