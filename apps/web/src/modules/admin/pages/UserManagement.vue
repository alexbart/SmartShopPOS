<script setup lang="ts">
import { ref, computed } from 'vue';
import { User, Trash2, Key, Plus, Pencil, X } from '@lucide/vue';
import { useUsers, useRoles } from '../composables/useAdmin.js';
import type { User as UserType } from '../composables/types.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { users, usersLoading, resetPasswordMutation, deactivateUserMutation, createUserMutation, updateUserMutation } = useUsers();
const { roles } = useRoles();
const editingUser = ref<UserType | null>(null);
const showForm = ref(false);
const resettingUser = ref<UserType | null>(null);
const resetPassword = ref('');
const form = ref({ firstName: '', lastName: '', email: '', password: '', roleId: '', isActive: true });

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
  if ((status || 'active').toLowerCase() === 'active') return 'bg-success/10 text-success';
  if (status.toLowerCase() === 'pending') return 'bg-warning/10 text-warning';
  return 'bg-muted/30 text-muted-foreground';
}

function getInitials(user: UserType): string {
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '??';
}

function openResetPassword(user: UserType) {
  resettingUser.value = user;
  resetPassword.value = '';
}

async function saveResetPassword() {
  if (!resettingUser.value) return;
  await resetPasswordMutation.mutateAsync({ userId: resettingUser.value.id, password: resetPassword.value });
  resettingUser.value = null;
}

function handleDeactivate(user: UserType) {
  deactivateUserMutation.mutateAsync(user.id);
}

function openCreate() {
  editingUser.value = null;
  form.value = { firstName: '', lastName: '', email: '', password: '', roleId: roles.value[0]?.id ?? '', isActive: true };
  showForm.value = true;
}

function openEdit(user: UserType) {
  editingUser.value = user;
  form.value = { firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', roleId: roles.value.find((role) => role.name === user.role)?.id ?? '', isActive: (user.status || 'active').toLowerCase() === 'active' };
  showForm.value = true;
}

async function saveUser() {
  const value = form.value;
  if (editingUser.value) {
    await updateUserMutation.mutateAsync({ id: editingUser.value.id, firstName: value.firstName, lastName: value.lastName, email: value.email, roleId: value.roleId || undefined, isActive: value.isActive });
  } else {
    await createUserMutation.mutateAsync({ firstName: value.firstName, lastName: value.lastName, email: value.email, password: value.password, roleId: value.roleId || undefined });
  }
  showForm.value = false;
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
        <button @click="openCreate" class="btn btn-primary btn-sm"><Plus class="w-4 h-4 mr-1" /> Add user</button>
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
              <button @click="openEdit(user)" class="p-1 rounded hover:bg-muted/30 touch-target" aria-label="Edit user">
                <Pencil class="w-3 h-3 text-muted-foreground" />
              </button>
              <button @click="openResetPassword(user)" class="p-1 rounded hover:bg-muted/30 touch-target" aria-label="Reset password">
                <Key class="w-3 h-3 text-muted-foreground" />
              </button>
              <button @click="handleDeactivate(user)" class="p-1 rounded hover:bg-muted/30 touch-target" aria-label="Deactivate user">
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
              {{ (user.status || 'active').toLowerCase() }}
            </span>
          </div>

          <div v-if="user.branchName || user.branch" class="text-sm text-muted-foreground mb-2">
            Branch: {{ user.branchName || user.branch }}
          </div>

          <div v-if="user.lastLoginAt" class="text-xs text-muted-foreground">
            Last login: {{ new Date(user.lastLoginAt).toLocaleDateString('en-KE') }}
          </div>

          <div class="flex gap-2 mt-3 pt-3 border-t">
            <button
              @click="openResetPassword(user)"
              class="btn btn-outline btn-sm flex-1 touch-target"
            >
              <Key class="w-3 h-3 mr-1" />
              Reset Password
            </button>
            <button
              v-if="(user.status || 'active').toLowerCase() === 'active'"
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

      <div v-if="resettingUser" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="resettingUser = null">
        <form class="w-full max-w-md space-y-4 rounded-lg bg-background p-6 shadow-xl" @submit.prevent="saveResetPassword">
          <h2 class="text-lg font-semibold">Reset password for {{ resettingUser.firstName }}</h2>
          <label class="block space-y-1 text-sm">New password<input v-model="resetPassword" required minlength="12" type="password" class="input w-full" /></label>
          <div class="flex justify-end gap-2"><button type="button" @click="resettingUser = null" class="btn btn-outline btn-sm">Cancel</button><button type="submit" :disabled="resetPasswordMutation.isPending.value" class="btn btn-primary btn-sm">Set password</button></div>
        </form>
      </div>

      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showForm = false">
        <form class="w-full max-w-lg space-y-4 rounded-lg bg-background p-6 shadow-xl" @submit.prevent="saveUser">
          <div class="flex items-center justify-between"><h2 class="text-lg font-semibold">{{ editingUser ? 'Edit user' : 'Add user' }}</h2><button type="button" @click="showForm = false" aria-label="Close"><X class="h-4 w-4" /></button></div>
          <div class="grid grid-cols-2 gap-3">
            <label class="space-y-1 text-sm">First name<input v-model.trim="form.firstName" required minlength="2" class="input w-full" /></label>
            <label class="space-y-1 text-sm">Last name<input v-model.trim="form.lastName" required minlength="2" class="input w-full" /></label>
          </div>
          <label class="block space-y-1 text-sm">Email<input v-model.trim="form.email" required type="email" class="input w-full" /></label>
          <label v-if="!editingUser" class="block space-y-1 text-sm">Temporary password<input v-model="form.password" required minlength="12" type="password" class="input w-full" /></label>
          <label class="block space-y-1 text-sm">Role<select v-model="form.roleId" required class="input w-full"><option disabled value="">Select a role</option><option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option></select></label>
          <label v-if="editingUser" class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" /> Active</label>
          <div class="flex justify-end gap-2"><button type="button" @click="showForm = false" class="btn btn-outline btn-sm">Cancel</button><button type="submit" :disabled="createUserMutation.isPending.value || updateUserMutation.isPending.value" class="btn btn-primary btn-sm">{{ editingUser ? 'Save changes' : 'Create user' }}</button></div>
        </form>
      </div>
    </div>
  </WorkspaceShell>
</template>
