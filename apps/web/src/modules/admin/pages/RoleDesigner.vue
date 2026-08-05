<script setup lang="ts">
import { ref, computed } from 'vue';
import { Shield, Plus, Save, Trash2, Users } from '@lucide/vue';
import { useRoles } from '../composables/useAdmin.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { roles, allPermissionsGrouped, createRoleMutation, updateRoleMutation } = useRoles();

const editingRole = ref(null);
const showNewRole = ref(false);
const newRoleName = ref('');
const newRoleDescription = ref('');
const selectedPermissions = ref<Set<string>>(new Set());

function startEdit(role) {
  editingRole.value = { ...role };
  selectedPermissions.value = new Set((role.permissions || []).map((p: any) => p.id || p));
}

function startNewRole() {
  showNewRole.value = true;
  editingRole.value = null;
  newRoleName.value = '';
  newRoleDescription.value = '';
  selectedPermissions.value = new Set();
}

function togglePermission(id: string) {
  if (selectedPermissions.value.has(id)) {
    selectedPermissions.value.delete(id);
  } else {
    selectedPermissions.value.add(id);
  }
}

function saveRole() {
  if (editingRole.value) {
    updateRoleMutation.mutateAsync({
      id: editingRole.value.id,
      name: editingRole.value.name,
      description: editingRole.value.description,
      permissionIds: Array.from(selectedPermissions.value),
    });
    editingRole.value = null;
    selectedPermissions.value.clear();
  }
}

function saveNewRole() {
  if (!newRoleName.value) return;
  createRoleMutation.mutateAsync({
    name: newRoleName.value,
    description: newRoleDescription.value,
    permissionIds: Array.from(selectedPermissions.value),
  });
  showNewRole.value = false;
  newRoleName.value = '';
  newRoleDescription.value = '';
  selectedPermissions.value.clear();
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Role Designer"
    workspace-description="Design custom roles with fine-grained permissions"
  >
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Shield class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-medium">Roles</h2>
        </div>
        <button @click="startNewRole()" class="btn btn-primary touch-target">
          <Plus class="w-4 h-4 mr-2" />
          New Role
        </button>
      </div>

      <div v-if="showNewRole" class="card p-4 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Role Name</label>
            <input v-model="newRoleName" type="text" class="input w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Description</label>
            <input v-model="newRoleDescription" type="text" class="input w-full" />
          </div>
        </div>
        <PermissionGrid :permissions="allPermissionsGrouped" :selected="selectedPermissions" @toggle="togglePermission" />
        <div class="flex gap-2">
          <button @click="saveNewRole" :disabled="createRoleMutation.isPending || !newRoleName" class="btn btn-primary">
            {{ createRoleMutation.isPending ? 'Creating...' : 'Create Role' }}
          </button>
          <button @click="showNewRole = false" class="btn btn-outline">Cancel</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          v-for="role in roles"
          :key="role.id"
          class="card p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <Shield class="w-4 h-4 text-primary" />
              <h3 class="font-bold">{{ role.name }}</h3>
            </div>
            <span class="text-xs text-muted-foreground">
              {{ (role.permissions || []).length }} permissions
            </span>
          </div>

          <p v-if="role.description" class="text-sm text-muted-foreground mb-3">
            {{ role.description }}
          </p>

          <div v-if="editingRole && editingRole.id === role.id" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">Role Name</label>
              <input v-model="editingRole.name" type="text" class="input w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Description</label>
              <input v-model="editingRole.description" type="text" class="input w-full" />
            </div>
            <PermissionGrid :permissions="allPermissionsGrouped" :selected="selectedPermissions" @toggle="togglePermission" />
            <div class="flex gap-2">
              <button @click="saveRole" :disabled="updateRoleMutation.isPending" class="btn btn-primary">
                <Save class="w-3 h-3 mr-1" />
                Save
              </button>
              <button @click="editingRole = null" class="btn btn-outline">Cancel</button>
            </div>
          </div>

          <div v-else class="flex justify-between">
            <button
              @click="startEdit(role)"
              class="btn btn-outline btn-sm touch-target"
            >
              Edit
            </button>
            <div class="flex items-center text-xs text-muted-foreground">
              <Users class="w-3 h-3 mr-1" />
              <span>{{ role._count?.users || 0 }} users</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="roles.length === 0" class="text-center py-8 text-muted-foreground">
        No roles found. Create your first role to get started.
      </div>
    </div>
  </WorkspaceShell>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue';
import { CheckSquare, Square } from '@lucide/vue';

export default defineComponent({
  name: 'PermissionGrid',
  props: {
    permissions: {
      type: Object as () => Record<string, Array<{ id: string; resource: string; action: string; description?: string }>>,
      required: true,
    },
    selected: {
      type: Set,
      required: true,
    },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () => h('div', { class: 'space-y-4' },
      Object.entries(props.permissions).map(([group, perms]) =>
        h('div', { key: group }, [
          h('h4', { class: 'font-medium text-sm mb-2' }, group),
          h('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-2' },
            perms.map(p =>
              h('label', { key: p.id, class: 'flex items-center gap-2 text-sm cursor-pointer' }, [
                h('input', {
                  type: 'checkbox',
                  checked: props.selected.has(p.id),
                  onClick: (e: Event) => {
                    e.preventDefault();
                    emit('toggle', p.id);
                  },
                }),
                h('span', {}, `${p.action} ${p.resource}`),
              ]),
            ),
          ),
        ]),
      ),
    );
  },
});
</script>
