<script setup lang="ts">
import { computed } from 'vue';
import { Building, Users, Check, X, Edit3 } from '@lucide/vue';
import { useBranches } from '../composables/useAdmin.js';
import type { Branch } from '../composables/types.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import StatusBadge from '@/components/business/StatusBadge.vue';

const { branches, branchesLoading, updateBranchMutation } = useBranches();

const branchCards = computed(() => {
  return (branches.value || []).map((b: Branch) => ({
    id: b.id,
    name: b.name || 'Unnamed Branch',
    code: b.code || '',
    address: b.address || '',
    employeeCount: b.employeeCount || 0,
    status: (b.status || 'OPEN') === 'OPEN' ? 'open' : 'closed',
    phone: b.phone || '',
  }));
});

function toggleBranchStatus(branch: Branch) {
  updateBranchMutation.mutateAsync({
    id: branch.id,
    status: branch.status === 'OPEN' ? 'CLOSED' : 'OPEN',
  });
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Branch Management"
    workspace-description="Manage your store locations"
  >
    <div class="space-y-6">
      <div v-if="branchesLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="card p-4 h-32 animate-pulse">
          <div class="h-4 bg-muted/30 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-muted/30 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="branch in branchCards"
          :key="branch.id"
          class="card p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
              <Building class="w-4 h-4 text-primary" />
            </div>
            <StatusBadge :status="branch.status" />
          </div>

          <h3 class="font-bold text-lg">{{ branch.name }}</h3>
          <p class="text-sm text-muted-foreground mb-2">{{ branch.code }}</p>
          <p v-if="branch.address" class="text-sm text-muted-foreground mb-3">
            {{ branch.address }}
          </p>

          <div class="flex items-center gap-4 mb-3 text-sm">
            <div class="flex items-center gap-1">
              <Users class="w-3 h-3 text-muted-foreground" />
              <span>{{ branch.employeeCount }} employees</span>
            </div>
          </div>

          <div class="flex gap-2 pt-2 border-t">
            <button
              @click="toggleBranchStatus(branch)"
              :disabled="updateBranchMutation.isPending"
              class="btn btn-outline btn-sm flex-1 touch-target"
            >
              <component
                :is="branch.status === 'open' ? X : Check"
                class="w-3 h-3 mr-1"
              />
              {{ branch.status === 'open' ? 'Close' : 'Open' }}
            </button>
            <button class="btn btn-outline btn-sm touch-target">
              <Edit3 class="w-3 h-3" />
            </button>
          </div>
        </div>

        <div v-if="branchCards.length === 0" class="col-span-full text-center py-12 text-muted-foreground">
          No branches found.
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
