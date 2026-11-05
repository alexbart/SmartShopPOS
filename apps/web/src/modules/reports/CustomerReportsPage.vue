<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { exportReportPdf } from './report-export';

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
watch(type, () => { result.value = null; });
</script>
<template>
  <WorkspaceShell workspace-title="Customer Reports" workspace-description="Customer purchasing and engagement summaries">
    <div class="mb-5 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <label class="min-w-48 flex-1 space-y-1 text-sm"><span class="text-muted-foreground">Report</span><select v-model="type" class="w-full rounded-md border bg-background px-3 py-2"><option v-for="item in types" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
      <label v-if="type === 'customers'" class="min-w-48 flex-1 space-y-1 text-sm"><span class="text-muted-foreground">Search customers</span><input v-model="search" class="w-full rounded-md border bg-background px-3 py-2" placeholder="Name or code"></label>
      <button class="btn btn-primary" :disabled="loading" @click="runReport">{{ loading ? 'Loading…' : 'Run report' }}</button><button v-if="rows.length" class="btn btn-secondary" @click="exportCsv">Export CSV</button><button v-if="result" class="btn btn-secondary" @click="exportReportPdf(type === 'top' ? 'top-customers' : 'customers', { search: search || undefined, page: 1, limit: 100 }, `customers-${type}.pdf`)">Export PDF</button>
    </div>
    <div v-if="result && rows.length" class="overflow-auto rounded-lg border bg-card"><table class="w-full text-left text-sm"><thead class="bg-muted/50"><tr><th v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2">{{ key.replaceAll(/([A-Z])/g, ' $1') }}</th></tr></thead><tbody><tr v-for="(row, index) in rows" :key="row.customerId || index" class="border-t"><td v-for="key in Object.keys(rows[0])" :key="key" class="whitespace-nowrap px-3 py-2">{{ row[key] }}</td></tr></tbody></table></div>
    <div v-else-if="result" class="rounded-lg border bg-card p-10 text-center text-muted-foreground">No records found for this report.</div>
  </WorkspaceShell>
</template>
