<script setup lang="ts">
import { computed } from 'vue';
import { Receipt, Edit3, Trash2 } from '@lucide/vue';
import { useTaxes } from '../composables/useAdmin.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { taxes, taxesLoading } = useTaxes();

const activeTaxes = computed(() => taxes.value.filter((t) => t.isActive));
const inactiveTaxes = computed(() => taxes.value.filter((t) => !t.isActive));
</script>

<template>
  <WorkspaceShell
    workspace-title="Tax Management"
    workspace-description="Manage tax rates and regulations"
  >
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Receipt class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-medium">Taxes</h2>
        </div>
        <button class="btn btn-primary touch-target">
          New Tax
        </button>
      </div>

      <div v-if="taxesLoading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-16 bg-muted/30 rounded animate-pulse"></div>
      </div>

      <div v-else class="space-y-4">
        <div v-if="activeTaxes.length > 0">
          <h3 class="text-sm font-medium text-muted-foreground mb-2">Active</h3>
          <div class="space-y-2">
            <div
              v-for="tax in activeTaxes"
              :key="tax.id"
              class="card p-3 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <Receipt class="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p class="font-medium">{{ tax.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ tax.code }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium">{{ tax.rate }}%</span>
                <button class="p-1 rounded hover:bg-muted/30 touch-target">
                  <Edit3 class="w-3 h-3 text-muted-foreground" />
                </button>
                <button class="p-1 rounded hover:bg-muted/30 touch-target">
                  <Trash2 class="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="inactiveTaxes.length > 0">
          <h3 class="text-sm font-medium text-muted-foreground mb-2">Inactive</h3>
          <div class="space-y-2">
            <div
              v-for="tax in inactiveTaxes"
              :key="tax.id"
              class="card p-3 flex items-center justify-between opacity-60"
            >
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded bg-muted/30 flex items-center justify-center">
                  <Receipt class="w-3 h-3 text-muted-foreground" />
                </div>
                <div>
                  <p class="font-medium">{{ tax.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ tax.code }}</p>
                </div>
              </div>
              <span class="text-sm font-medium">{{ tax.rate }}%</span>
            </div>
          </div>
        </div>

        <div v-if="taxes.length === 0" class="text-center py-8 text-muted-foreground">
          No taxes configured.
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
