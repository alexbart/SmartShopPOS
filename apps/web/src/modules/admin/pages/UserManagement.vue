<script setup lang="ts">
import { ref, computed } from 'vue';
import { User, Mail, Trash2, Key, Check, X } from '@lucide/vue';
import { useUsers } from '../composables/useAdmin.js';
import type { User as UserType } from '../composables/types.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { users, usersLoading, resetPasswordMutation, deactivateUserMutation } = useUsers();

const searchQuery = ref('');

const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return users.value || [];
  return (users.value || []).filter(
    (u) =>
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q),
  );
});

function getRoleBadgeColor(role: string): string {
  const r = (role || '').toLowerCase();
  if (r.includes('admin')) return 'bg-primary/10 text-primary';
  if (r.includes('manager')) return 'bg-blue/10 text-blue';
  return 'bg-muted/30 text-muted-foreground';
}

function getStatusColor(status: string): string {
  if ((status || 'active') === 'active') return 'bg-success/10 text-success';
  if (status === 'pending') return 'bg-warning/10 text-warning';
  return 'bg-muted/30 text-muted-foreground';
}

function getInitials(user: UserType): string {
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '??';
}

function handleResetPassword(user: UserType) {
  resetPasswordMutation.mutateAsync(user.id);
}

function handleDeactivate(user: UserType) {
  deactivateUserMutation.mutateAsync(user.id);
}
</script>

<template>
  <WorkspaceShell
    workspace-title="User Management"
    workspace-description="Manage team members and their access"
  >
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="input pl-8 w-64"
          />
        </div>
      </div>

      <div v-if="usersLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="card p-4 h-32 animate-pulse">
          <div class="h-4 bg-muted/30 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-muted/30 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="card p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
              {{ getInitials(user) }}
            </div>
            <div class="flex gap-1">
              <button class="p-1 rounded hover:bg-muted/30 touch-target">
                <Key class="w-3 h-3 text-muted-foreground" />
              </button>
              <button class="p-1 rounded hover:bg-muted/30 touch-target">
                <Trash2 class="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          <h3 class="font-bold">{{ user.firstName }} {{ user.lastName }}</h3>
          <p class="text-sm text-muted-foreground mb-2">{{ user.email }}</p>

          <div class="flex items-center gap-2 mb-2">
            <span :class="getRoleBadgeColor(user.role || '')" class="px-2 py-0.5 rounded-full text-xs">
              {{ user.role || 'Staff' }}
            </span>
            <span :class="getStatusColor(user.status || 'active')" class="px-2 py-0.5 rounded-full text-xs">
              {{ user.status || 'active' }}
            </span>
          </div>

          <div v-if="user.branch" class="text-sm text-muted-foreground mb-2">
            Branch: {{ user.branch }}
          </div>

          <div v-if="user.lastLoginAt" class="text-xs text-muted-foreground">
            Last login: {{ new Date(user.lastLoginAt).toLocaleDateString('en-KE') }}
          </div>

          <div class="flex gap-2 mt-3 pt-3 border-t">
            <button
              @click="handleResetPassword(user)"
              :disabled="resetPasswordMutation.isPending"
              class="btn btn-outline btn-sm flex-1 touch-target"
            >
              <Key class="w-3 h-3 mr-1" />
              Reset Password
            </button>
            <button
              v-if="(user.status || 'active') === 'active'"
              @click="handleDeactivate(user)"
              class="btn btn-outline btn-sm flex-1 touch-target"
            >
              <X class="w-3 h-3 mr-1" />
              Deactivate
            </button>
          </div>
        </div>

        <div v-if="filteredUsers.length === 0" class="col-span-full text-center py-12 text-muted-foreground">
          No users found.
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
