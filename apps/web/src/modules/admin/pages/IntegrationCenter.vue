<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Plug,
  Check,
  X,
  Wifi,
  Smartphone,
  Globe,
  Database,
  Cloud,
  Mail,
  CreditCard,
} from '@lucide/vue';
import { useIntegrations } from '../composables/useAdmin.js';
import type { Integration } from '../composables/types.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { integrations } = useIntegrations();

const showConfigure = ref<string | null>(null);

const integrationIcons: Record<string, any> = {
  mpesa: CreditCard,
  email: Mail,
  redis: Database,
  s3: Cloud,
};

const statusIcons = {
  configured: { icon: Check, color: 'text-success', bg: 'bg-success/10' },
  connected: { icon: Check, color: 'text-success', bg: 'bg-success/10' },
  not_configured: { icon: X, color: 'text-muted-foreground', bg: 'bg-muted/30' },
  disabled: { icon: Wifi, color: 'text-muted-foreground', bg: 'bg-muted/30' },
};
</script>

<template>
  <WorkspaceShell
    workspace-title="Integration Center"
    workspace-description="Connect third-party services to SmartShopPOS"
  >
    <div class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="integration in integrations"
          :key="integration.id"
          class="card p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="statusIcons[integration.status]?.bg || 'bg-muted/30'"
            >
              <component
                :is="integrationIcons[integration.id] || Plug"
                class="w-5 h-5"
                :class="statusIcons[integration.status]?.color || 'text-muted-foreground'"
              />
            </div>
            <span
              class="px-2 py-0.5 rounded-full text-xs"
              :class="statusIcons[integration.status]?.bg || 'bg-muted/30'"
            >
              {{ integration.status.replace('_', ' ') }}
            </span>
          </div>

          <h3 class="font-medium">{{ integration.name }}</h3>
          <p class="text-sm text-muted-foreground mt-1">
            {{ integration.description }}
          </p>

          <div v-if="integration.status === 'not_configured'" class="mt-3">
            <button
              @click="showConfigure = integration.id"
              class="btn btn-outline btn-sm w-full touch-target"
            >
              Configure Later
            </button>
          </div>

          <div v-else-if="integration.status === 'disabled'" class="mt-3">
            <button class="btn btn-outline btn-sm w-full touch-target">
              Enable
            </button>
          </div>

          <div v-else class="mt-3">
            <button class="btn btn-outline btn-sm w-full touch-target">
              Configure
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="showConfigure"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div class="card p-6 w-full max-w-md">
          <h3 class="text-lg font-bold mb-4">Configure Integration</h3>
          <p class="text-sm text-muted-foreground mb-4">
            Configure your integration settings here.
          </p>
          <div class="space-y-4">
            <input type="text" class="input w-full" placeholder="API Key" />
            <input type="text" class="input w-full" placeholder="Endpoint URL" />
          </div>
          <div class="flex gap-2 mt-4">
            <button @click="showConfigure = null" class="btn btn-outline flex-1">Cancel</button>
            <button class="btn btn-primary flex-1">Save</button>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
