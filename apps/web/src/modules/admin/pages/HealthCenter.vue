<script setup lang="ts">
import { computed } from 'vue';
import { Activity, AlertTriangle, CheckCircle, Database, RefreshCw, Server, XCircle } from '@lucide/vue';
import { useHealth } from '../composables/useAdmin.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { Button } from '@/components/ui/button';

const { health, healthLoading, healthRefreshing, healthError, refreshHealth } = useHealth();

const statusStyles: Record<string, string> = {
  healthy: 'bg-success/10 text-success border-success/20',
  degraded: 'bg-warning/10 text-warning border-warning/20',
  down: 'bg-destructive/10 text-destructive border-destructive/20',
  disabled: 'bg-muted/40 text-muted-foreground border-border',
};

const statusIcon = computed(() => {
  if (health.value?.status === 'down') return XCircle;
  if (health.value?.status === 'degraded') return AlertTriangle;
  return CheckCircle;
});

const statusLabel = computed(() => {
  if (!health.value) return 'Status unavailable';
  return health.value.status === 'healthy'
    ? 'All monitored services are healthy'
    : health.value.status === 'degraded'
      ? 'Some optional services need attention'
      : 'A core service is unavailable';
});

const memoryUsedPercent = computed(() => {
  const memory = health.value?.system.memory;
  if (!memory?.heapTotalBytes) return 0;
  return Math.min(100, Math.round((memory.heapUsedBytes / memory.heapTotalBytes) * 100));
});

function getServiceIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('database') || normalized.includes('postgres')) return Database;
  if (normalized.includes('api')) return Server;
  return Activity;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return [days ? `${days}d` : '', hours ? `${hours}h` : '', `${minutes}m`].filter(Boolean).join(' ');
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return 'Not checked yet';
  return new Date(timestamp).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}
</script>

<template>
  <WorkspaceShell workspace-title="Health Center" workspace-description="Live service checks and API runtime diagnostics">
    <div class="space-y-6">
      <div v-if="healthLoading && !health" class="space-y-4">
        <div class="h-28 animate-pulse rounded-xl bg-muted/40" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-xl bg-muted/40" />
        </div>
      </div>

      <div v-else-if="healthError && !health" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 class="font-semibold text-destructive">Health diagnostics are unavailable</h2>
        <p class="mt-1 text-sm text-muted-foreground">Check your access and API connection, then try again.</p>
        <Button class="mt-4" variant="outline" :disabled="healthRefreshing" @click="refreshHealth()">
          <RefreshCw class="mr-2 h-4 w-4" :class="healthRefreshing && 'animate-spin'" />Retry
        </Button>
      </div>

      <template v-else-if="health">
        <section class="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5" :class="statusStyles[health.status]">
          <div class="flex items-center gap-4">
            <component :is="statusIcon" class="h-8 w-8 shrink-0" />
            <div>
              <p class="text-lg font-semibold capitalize">{{ health.status }}</p>
              <p class="text-sm opacity-80">{{ statusLabel }}</p>
              <p class="mt-1 text-xs opacity-70">Last checked {{ formatTimestamp(health.checkedAt) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs opacity-75">Checks refresh every 30 seconds</span>
            <Button variant="outline" :disabled="healthRefreshing" @click="refreshHealth()">
              <RefreshCw class="mr-2 h-4 w-4" :class="healthRefreshing && 'animate-spin'" />
              Refresh now
            </Button>
          </div>
        </section>

        <div v-if="healthError" class="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          The latest refresh failed. Showing the last successful health check.
        </div>

        <section>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="font-semibold">Service checks</h2>
            <span class="text-xs text-muted-foreground">{{ health.services.length }} monitored</span>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article v-for="service in health.services" :key="service.name" class="rounded-xl border bg-card p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                    <component :is="getServiceIcon(service.name)" class="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 class="font-medium">{{ service.name }}</h3>
                    <p class="text-xs text-muted-foreground">{{ service.latencyMs === undefined ? '—' : `${service.latencyMs} ms` }}</p>
                  </div>
                </div>
                <span class="rounded-full border px-2.5 py-1 text-xs capitalize" :class="statusStyles[service.status]">
                  {{ service.status }}
                </span>
              </div>
              <p v-if="service.details" class="mt-4 text-sm text-muted-foreground">{{ service.details }}</p>
              <p class="mt-3 text-xs text-muted-foreground">Checked {{ formatTimestamp(service.checkedAt) }}</p>
            </article>
          </div>
        </section>

        <section class="rounded-xl border bg-card p-5">
          <div class="mb-4 flex items-center gap-2">
            <Activity class="h-4 w-4 text-primary" />
            <h2 class="font-semibold">API runtime</h2>
            <span class="ml-auto text-xs text-muted-foreground">Version {{ health.build.version }}</span>
          </div>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p class="text-sm text-muted-foreground">Uptime</p>
              <p class="mt-1 text-lg font-semibold">{{ formatUptime(health.system.uptimeSeconds) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Heap used</p>
              <p class="mt-1 text-lg font-semibold">{{ formatBytes(health.system.memory.heapUsedBytes) }} / {{ formatBytes(health.system.memory.heapTotalBytes) }}</p>
              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${memoryUsedPercent}%` }" />
              </div>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Process memory</p>
              <p class="mt-1 text-lg font-semibold">{{ formatBytes(health.system.memory.rssBytes) }}</p>
              <p class="text-xs text-muted-foreground">Resident set size</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">CPU load average</p>
              <p v-if="health.system.cpu.supported && health.system.cpu.loadAverage" class="mt-1 text-lg font-semibold">
                {{ health.system.cpu.loadAverage.map((value) => value.toFixed(2)).join(' / ') }}
              </p>
              <p v-else class="mt-1 text-sm text-muted-foreground">Not available on this platform</p>
            </div>
          </div>
        </section>
      </template>
    </div>
  </WorkspaceShell>
</template>
