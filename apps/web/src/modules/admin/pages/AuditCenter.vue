<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Clock, FileText, Settings, User, Trash2, Edit, Shield, Search, ChevronLeft, ChevronRight, RotateCcw } from '@lucide/vue';
import { useAuditLog } from '../composables/useAdmin.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';

const filters = reactive({ search: '', action: '', entity: '', outcome: '', from: '', to: '' });
const applied = reactive({ ...filters, page: 1 });
const integrity = ref<{ valid: boolean; checkedEvents: number; firstInvalidEventId: string | null; verifiedAt: string } | null>(null);
const checkingIntegrity = ref(false);
const exportingAudit = ref(false);
const exportingAuditPdf = ref(false);
const { entries, total, pages, auditLoading } = useAuditLog(() => ({
  ...applied,
  limit: 50,
  from: applied.from ? new Date(`${applied.from}T00:00:00`).toISOString() : '',
  to: applied.to ? new Date(`${applied.to}T23:59:59.999`).toISOString() : '',
}));

const actionIcons: Record<string, any> = {
  CREATE: FileText,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: User,
  LOGOUT: User,
  ACCESS_DENIED: Shield,
  AUTH_FAILURE: Shield,
  SETTINGS: Settings,
};

const pageLabel = computed(() => pages.value ? `Page ${applied.page} of ${pages.value}` : 'No pages');

async function verifyIntegrity() {
  checkingIntegrity.value = true;
  try {
    const response = await apiClient.get('/audit/integrity');
    integrity.value = response.data.data;
    if (integrity.value?.valid) notification.success('Audit chain integrity verified');
    else notification.error('Audit chain integrity check failed');
  } catch {
    notification.error('Could not verify the audit chain');
  } finally {
    checkingIntegrity.value = false;
  }
}

function csvCell(value: unknown): string {
  const normalized = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
  return `"${normalized.replaceAll('"', '""')}"`;
}

async function exportAuditReport() {
  exportingAudit.value = true;
  try {
    const all: any[] = [];
    let page = 1;
    let pages = 1;
    do {
      const query = new URLSearchParams({ page: String(page), limit: '100' });
      if (applied.search) query.set('search', applied.search);
      if (applied.action) query.set('action', applied.action);
      if (applied.entity) query.set('entity', applied.entity);
      if (applied.outcome) query.set('outcome', applied.outcome);
      if (applied.from) query.set('from', new Date(`${applied.from}T00:00:00`).toISOString());
      if (applied.to) query.set('to', new Date(`${applied.to}T23:59:59.999`).toISOString());
      const response = await apiClient.get(`/audit?${query.toString()}`);
      const data = response.data.data;
      all.push(...data.items);
      pages = data.pages;
      page += 1;
    } while (page <= pages);

    if (!all.length) { notification.info('No audit events match the current filters'); return; }
    const records = all.map((entry) => ({
      eventId: entry.id,
      timestamp: entry.createdAt,
      actor: actorName(entry),
      actorId: entry.actorId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      outcome: entry.details?.outcome,
      summary: entry.details?.summary,
      branch: entry.details?.branch?.name,
      route: `${entry.details?.method ?? ''} ${entry.details?.route ?? ''}`.trim(),
      ipAddress: entry.details?.ipAddress,
      requestId: entry.requestId,
      oldValues: entry.details?.oldValues,
      newValues: entry.details?.newValues,
      eventHash: entry.details?.eventHash,
    }));
    const headers = Object.keys(records[0]);
    const csv = [headers.map(csvCell).join(','), ...records.map((row) => headers.map((key) => csvCell((row as Record<string, unknown>)[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `audit-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
    notification.success(`Exported ${records.length} audit events`);
  } catch {
    notification.error('Could not export the audit report');
  } finally { exportingAudit.value = false; }
}

async function exportAuditPdf() {
  exportingAuditPdf.value = true;
  try {
    const query = new URLSearchParams();
    if (applied.search) query.set('search', applied.search);
    if (applied.action) query.set('action', applied.action);
    if (applied.entity) query.set('entity', applied.entity);
    if (applied.outcome) query.set('outcome', applied.outcome);
    if (applied.from) query.set('from', new Date(`${applied.from}T00:00:00`).toISOString());
    if (applied.to) query.set('to', new Date(`${applied.to}T23:59:59.999`).toISOString());
    const response = await apiClient.get(`/audit/export.pdf?${query.toString()}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a'); link.href = url; link.download = 'audit-report.pdf'; link.click(); URL.revokeObjectURL(url);
    const exported = Number(response.headers['x-exported-events'] ?? 0);
    const totalEvents = Number(response.headers['x-total-events'] ?? exported);
    if (totalEvents > exported) notification.warning(`PDF includes the latest ${exported} of ${totalEvents} matching events; CSV includes all matches`);
    else notification.success('Audit PDF exported');
  } catch {
    notification.error('Could not export the audit PDF');
  } finally { exportingAuditPdf.value = false; }
}

function applyFilters() {
  Object.assign(applied, filters, { page: 1 });
}

function clearFilters() {
  Object.assign(filters, { search: '', action: '', entity: '', outcome: '', from: '', to: '' });
  Object.assign(applied, filters, { page: 1 });
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function actorName(entry: (typeof entries.value)[number]): string {
  if (entry.actorName) return entry.actorName;
  if (entry.user) return `${entry.user.firstName} ${entry.user.lastName}`.trim();
  return 'System / unknown user';
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? 'No recorded fields';
}

function outcomeClass(outcome?: string): string {
  if (outcome === 'SUCCESS') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  if (outcome === 'DENIED') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
}
</script>

<template>
  <WorkspaceShell workspace-title="Audit Center" workspace-description="Organization activity, security events, and change history">
    <div class="space-y-5">
      <form class="grid grid-cols-1 gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="applyFilters">
        <label class="space-y-1 text-sm">
          <span class="text-muted-foreground">Search</span>
          <input v-model="filters.search" class="w-full rounded-md border bg-background px-3 py-2" placeholder="Actor, record, request ID…">
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-muted-foreground">Action</span>
          <select v-model="filters.action" class="w-full rounded-md border bg-background px-3 py-2">
            <option value="">All actions</option>
            <option v-for="action in ['CREATE','UPDATE','DELETE','READ','LOGIN','LOGOUT','AUTH_FAILURE','ACCESS_DENIED','FAILED','SUBMIT','CANCEL','RECEIVE_GOODS']" :key="action" :value="action">{{ action.replaceAll('_', ' ') }}</option>
          </select>
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-muted-foreground">Entity</span>
          <input v-model="filters.entity" class="w-full rounded-md border bg-background px-3 py-2" placeholder="Product, customer, sale…">
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-muted-foreground">Outcome</span>
          <select v-model="filters.outcome" class="w-full rounded-md border bg-background px-3 py-2">
            <option value="">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="DENIED">Denied</option>
          </select>
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-muted-foreground">From</span>
          <input v-model="filters.from" type="date" class="w-full rounded-md border bg-background px-3 py-2">
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-muted-foreground">To</span>
          <input v-model="filters.to" type="date" class="w-full rounded-md border bg-background px-3 py-2">
        </label>
        <div class="flex items-end gap-2 lg:col-span-2">
          <Button type="submit"><Search class="mr-2 h-4 w-4" />Apply filters</Button>
          <Button type="button" variant="outline" @click="clearFilters"><RotateCcw class="mr-2 h-4 w-4" />Clear</Button>
        </div>
      </form>

      <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{{ total }} audit events · {{ pageLabel }}</span>
        <div class="flex flex-wrap items-center gap-3">
          <span v-if="integrity" :class="integrity.valid ? 'text-green-700 dark:text-green-400' : 'text-destructive'">
            {{ integrity.valid ? `Verified ${integrity.checkedEvents} chained events` : `Integrity issue at ${integrity.firstInvalidEventId}` }}
          </span>
          <Button type="button" variant="outline" :disabled="exportingAudit" @click="exportAuditReport">
            {{ exportingAudit ? 'Preparing export…' : 'Export filtered audit report' }}
          </Button>
          <Button type="button" variant="outline" :disabled="exportingAuditPdf" @click="exportAuditPdf">
            {{ exportingAuditPdf ? 'Preparing PDF…' : 'Export PDF' }}
          </Button>
          <Button type="button" variant="outline" :disabled="checkingIntegrity" @click="verifyIntegrity">
            {{ checkingIntegrity ? 'Verifying…' : 'Verify audit integrity' }}
          </Button>
        </div>
      </div>

      <div v-if="auditLoading" class="space-y-3">
        <div v-for="i in 6" :key="i" class="h-20 animate-pulse rounded-lg bg-muted/40" />
      </div>
      <div v-else-if="entries.length" class="divide-y rounded-lg border bg-card">
        <article v-for="entry in entries" :key="entry.id" class="p-4">
          <div class="flex items-start gap-3">
            <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <component :is="actionIcons[entry.action] || Clock" class="h-4 w-4 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium">{{ actorName(entry) }}</span>
                <span class="rounded px-2 py-0.5 text-xs font-medium" :class="outcomeClass(entry.details?.outcome)">{{ entry.details?.outcome || 'LEGACY' }}</span>
                <span class="text-sm text-muted-foreground">{{ formatTimestamp(entry.createdAt) }}</span>
              </div>
              <p class="mt-1 text-sm">
                <span class="font-medium">{{ entry.action.replaceAll('_', ' ') }}</span>
                <span class="text-muted-foreground"> · {{ entry.resource }} · record {{ entry.resourceId || '—' }}</span>
              </p>
              <p v-if="entry.details?.summary" class="mt-1 break-all text-xs text-muted-foreground">{{ entry.details.summary }}</p>
              <details class="mt-3 text-xs">
                <summary class="w-fit cursor-pointer select-none text-primary">Event details and change data</summary>
                <dl class="mt-3 grid gap-2 sm:grid-cols-2">
                  <div><dt class="text-muted-foreground">Event ID</dt><dd class="break-all font-mono">{{ entry.id }}</dd></div>
                  <div><dt class="text-muted-foreground">Request ID</dt><dd class="break-all font-mono">{{ entry.requestId || '—' }}</dd></div>
                  <div><dt class="text-muted-foreground">Route</dt><dd class="break-all font-mono">{{ entry.details?.method }} {{ entry.details?.route }}</dd></div>
                  <div><dt class="text-muted-foreground">Branch / IP</dt><dd>{{ entry.details?.branch?.name || '—' }} / {{ entry.details?.ipAddress || '—' }}</dd></div>
                  <div class="sm:col-span-2"><dt class="text-muted-foreground">Roles at event time</dt><dd>{{ (entry.details?.roles as string[] | undefined)?.join(', ') || '—' }}</dd></div>
                  <div class="sm:col-span-2"><dt class="text-muted-foreground">Before</dt><dd><pre class="mt-1 max-h-64 overflow-auto rounded bg-muted/40 p-2">{{ pretty(entry.details?.oldValues) }}</pre></dd></div>
                  <div class="sm:col-span-2"><dt class="text-muted-foreground">Submitted values</dt><dd><pre class="mt-1 max-h-64 overflow-auto rounded bg-muted/40 p-2">{{ pretty(entry.details?.newValues) }}</pre></dd></div>
                  <div class="sm:col-span-2"><dt class="text-muted-foreground">Integrity hash</dt><dd class="break-all font-mono">{{ entry.details?.eventHash || 'Legacy event without hash' }}</dd></div>
                </dl>
              </details>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="rounded-lg border bg-card py-12 text-center text-muted-foreground">No audit events match these filters.</div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" :disabled="applied.page <= 1 || auditLoading" @click="applied.page--"><ChevronLeft class="mr-1 h-4 w-4" />Previous</Button>
        <Button variant="outline" :disabled="applied.page >= pages || auditLoading" @click="applied.page++">Next<ChevronRight class="ml-1 h-4 w-4" /></Button>
      </div>
    </div>
  </WorkspaceShell>
</template>
