<script setup lang="ts">
import { Badge } from '@/components/ui/badge';

interface TabItem {
  label: string;
  value: string;
  icon?: any;
  count?: number | string;
}

const props = withDefaults(
  defineProps<{
    tabs: TabItem[];
    activeTab?: string;
    scrollable?: boolean;
  }>(),
  {
    activeTab: undefined,
    scrollable: true,
  },
);

const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void;
}>();

function handleTabChange(value: string) {
  emit('update:activeTab', value);
}
</script>

<template>
  <div
    v-if="tabs && tabs.length > 0"
    class="border-b bg-card px-4 sm:px-6 overflow-x-auto"
  >
    <nav
      class="flex items-center gap-1"
      :class="{ 'scrollbar-hide': scrollable }"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="handleTabChange(tab.value)"
        :class="[
          'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-md transition-all duration-150 whitespace-nowrap',
          activeTab === tab.value
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        ]"
      >
        <component v-if="tab.icon" :is="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
        <Badge
          v-if="tab.count !== undefined && Number(tab.count) > 0"
          variant="secondary"
          class="text-xs"
        >
          {{ tab.count }}
        </Badge>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
