<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Users,
  Building,
  Shield,
  Mail,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  Receipt,
  Banknote,
  Calendar,
} from '@lucide/vue';
import { useAdminDashboard } from './composables/useAdmin.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const router = useRouter();
const { dashboardData, isLoading } = useAdminDashboard();

const d = computed(() => dashboardData.value);

const summaryCards = computed(() => [
  {
    title: 'Active Users',
    value: d.value.activeUsers,
    icon: Users,
    subtitle: `${d.value.totalRoles} roles`,
  },
  {
    title: 'Branches',
    value: d.value.totalBranches,
    icon: Building,
    subtitle: `${d.value.openBranches} open`,
  },
  {
    title: 'Roles',
    value: d.value.totalRoles,
    icon: Shield,
    subtitle: 'Permissions managed',
  },
  {
    title: 'Pending Invites',
    value: d.value.pendingInvites,
    icon: Mail,
    subtitle: 'Awaiting acceptance',
  },
  {
    title: 'License',
    value: 'Business',
    icon: CreditCard,
    subtitle: d.value.organizationName,
  },
]);

const adminNavItems = [
  { label: 'Organization Profile', icon: LayoutDashboard, path: '/admin/organization' },
  { label: 'Branches', icon: Building, path: '/admin/branches' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Roles', icon: Shield, path: '/admin/roles' },
  { label: 'Taxes', icon: Receipt, path: '/admin/taxes' },
  { label: 'Theme Studio', icon: Settings, path: '/admin/theme' },
  { label: 'Integrations', icon: Banknote, path: '/admin/integrations' },
  { label: 'Audit Center', icon: BarChart3, path: '/admin/audit' },
  { label: 'Health Center', icon: Calendar, path: '/admin/health' },
];
</script>

<template>
  <WorkspaceShell
    workspace-title="Administration"
    workspace-description="Control center for your organization"
  >
    <div class="space-y-6">
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div v-for="i in 5" :key="i" class="card p-4 h-28 animate-pulse">
          <div class="h-4 bg-muted/30 rounded w-3/4 mb-2"></div>
          <div class="h-6 bg-muted/30 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div
          v-for="card in summaryCards"
          :key="card.title"
          class="card p-4"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <component :is="card.icon" class="w-4 h-4 text-primary" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">{{ card.title }}</p>
              <p class="text-2xl font-bold">{{ card.value }}</p>
              <p v-if="card.subtitle" class="text-xs text-muted-foreground">
                {{ card.subtitle }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-4">
        <h3 class="font-medium mb-3">Administration</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <button
            v-for="item in adminNavItems"
            :key="item.path"
            @click="router.push(item.path)"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 text-left transition-colors touch-target"
          >
            <component :is="item.icon" class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
