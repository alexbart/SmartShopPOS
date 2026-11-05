<script setup lang="ts">
interface PermissionOption {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

defineProps<{
  permissions: Record<string, PermissionOption[]>;
  selected: Set<string>;
}>();

const emit = defineEmits<{
  toggle: [permissionId: string];
}>();
</script>

<template>
  <div class="space-y-4">
    <section v-for="(groupPermissions, group) in permissions" :key="group">
      <h4 class="mb-2 text-sm font-medium">{{ group }}</h4>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label
          v-for="permission in groupPermissions"
          :key="permission.id"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <input
            type="checkbox"
            :checked="selected.has(permission.id)"
            @change="emit('toggle', permission.id)"
          />
          <span>{{ permission.action }} {{ permission.resource }}</span>
        </label>
      </div>
    </section>
  </div>
</template>
