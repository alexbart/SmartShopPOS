<script setup lang="ts">
import { computed } from 'vue';
import { Clock, FileText, Settings, User, Trash2, Edit, Shield } from '@lucide/vue';
import { useAuditLog } from '../composables/useAdmin.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { entries, auditLoading } = useAuditLog(() => ({ page: 1, limit: 100 }));

const groupedEntries = computed(() => {
  const groups: Record<string, any[]> = {};
  for (const entry of entries.value) {
    const date = new Date(entry.createdAt).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
  }
  return groups;
});

const actionIcons: Record<string, any> = {
  CREATE: FileText,
  UPDATE: Edit,
  DELETE: Trash2,
  APPROVE: Shield,
  LOGIN: User,
  LOGOUT: User,
  SETTINGS: Settings,
};

function getActionIcon(action: string): any {
  return actionIcons[action.toUpperCase()] || Clock;
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Audit Center"
    workspace-description="Monitor all activity in your organization"
  >
    <div class="space-y-6">
      <div v-if="auditLoading" class="space-y-4">
        <div v-for="i in 8" :key="i" class="h-16 bg-muted/30 rounded animate-pulse"></div>
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="[date, dayEntries] in Object.entries(groupedEntries)"
          :key="date"
        >
          <h3 class="font-medium text-sm text-muted-foreground mb-2">{{ date }}</h3>
          <div class="space-y-2">
            <div
              v-for="entry in dayEntries"
              :key="entry.id"
              class="flex items-center gap-3 py-2 border-b last:border-0"
            >
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <component :is="getActionIcon(entry.action)" class="w-3 h-3 text-primary" />
              </div>
              <div class="flex-1">
                <p class="font-medium text-sm">
                  {{ entry.user?.firstName || 'System' }} {{ entry.user?.lastName || '' }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ entry.action }} {{ entry.resource }}
                  <span v-if="entry.details" class="text-xs">
                    · {{ JSON.stringify(entry.details).slice(0, 50) }}
                  </span>
                </p>
              </div>
              <div class="text-xs text-muted-foreground">
                {{ formatTime(entry.createdAt) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="entries.length === 0" class="text-center py-8 text-muted-foreground">
          No audit entries found.
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
