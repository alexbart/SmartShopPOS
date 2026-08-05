<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle, XCircle, Wifi, Database, Mail, Cloud, RefreshCw } from '@lucide/vue';
import { useHealth } from '../composables/useAdmin.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { services, healthLoading } = useHealth();

const serviceIcons: Record<string, any> = {
  api: CheckCircle,
  database: Database,
  redis: Database,
  email: Mail,
  storage: Cloud,
};

const statusClasses: Record<string, string> = {
  healthy: 'bg-success/10 text-success',
  degraded: 'bg-warning/10 text-warning',
  down: 'bg-destructive/10 text-destructive',
  disabled: 'bg-muted/30 text-muted-foreground',
};

function getServiceIcon(name: string): any {
  return serviceIcons[name.toLowerCase()] || CheckCircle;
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Health Center"
    workspace-description="System health and service status"
  >
    <div class="space-y-6">
      <div v-if="healthLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="card p-4 h-24 animate-pulse">
          <div class="h-4 bg-muted/30 rounded w-3/4"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="service in services"
          :key="service.service"
          class="card p-4 text-center"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
            :class="statusClasses[service.status] || 'bg-muted/30'"
          >
            <component :is="getServiceIcon(service.service)" class="w-5 h-5" />
          </div>
          <h3 class="font-medium">{{ service.service }}</h3>
          <p
            class="text-xs mt-1 capitalize"
            :class="statusClasses[service.status] || 'text-muted-foreground'"
          >
            {{ service.status }}
          </p>
          <p v-if="service.details" class="text-xs text-muted-foreground mt-1">
            {{ service.details }}
          </p>
        </div>
      </div>

      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium">Overall Status</h3>
          <button class="btn btn-outline btn-sm touch-target">
            <RefreshCw class="w-3 h-3 mr-1" />
            Refresh
          </button>
        </div>
        <div class="space-y-2">
          <div v-for="service in services" :key="service.service" class="flex items-center justify-between">
            <span class="text-sm">{{ service.service }}</span>
            <span
              class="px-2 py-0.5 rounded-full text-xs capitalize"
              :class="statusClasses[service.status] || 'bg-muted/30'"
            >
              {{ service.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
