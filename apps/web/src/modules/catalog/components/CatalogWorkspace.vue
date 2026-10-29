<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TabItem {
  label: string;
  value: string;
  icon?: any;
  count?: number | string;
}

interface WorkspaceAction {
  label: string;
  icon?: any;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    workspaceIcon?: any;
    actionButton?: WorkspaceAction;
    tabs?: TabItem[];
    activeTab?: string;
    showToolbar?: boolean;
  }>(),
  {
    breadcrumbs: () => [],
    actionButton: undefined,
    tabs: () => [],
    activeTab: undefined,
    showToolbar: true,
  },
);

const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void;
  (e: 'focus-search'): void;
  (e: 'clear-filters'): void;
  (e: 'primary-action'): void;
  (e: 'export'): void;
  (e: 'escape-press'): void;
}>();

function handleTabChange(value: string) {
  emit('update:activeTab', value);
}

function handlePrimaryAction() {
  props.actionButton?.onClick();
  emit('primary-action');
}

const searchInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    if (!isInput && e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      emit('focus-search');
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && props.actionButton) {
      e.preventDefault();
      handlePrimaryAction();
      return;
    }

     if (e.key === 'Escape') {
      const isSearchFocused = document.activeElement === searchInputRef.value;
      if (isSearchFocused) {
        emit('clear-filters');
      } else {
        emit('escape-press');
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      emit('export');
    }
  };

  document.addEventListener('keydown', handler);
  onUnmounted(() => document.removeEventListener('keydown', handler));
});
</script>

<template>
  <div class="flex h-full flex-col">
    <div v-if="breadcrumbs && breadcrumbs.length" class="border-b bg-card px-4 sm:px-6 py-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem v-for="(crumb, i) in breadcrumbs" :key="i">
            <template v-if="crumb.href && i < breadcrumbs.length - 1">
              <RouterLink :to="crumb.href" class="breadcrumb-link">
                {{ crumb.label }}
              </RouterLink>
            </template>
            <template v-else>
              <BreadcrumbPage>{{ crumb.label }}</BreadcrumbPage>
            </template>
            <BreadcrumbSeparator v-if="i < breadcrumbs.length - 1" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>

    <div class="border-b bg-card px-4 sm:px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <component
            v-if="workspaceIcon"
            :is="workspaceIcon"
            class="h-6 w-6 text-primary"
          />
          <div>
            <h1 class="text-2xl font-bold">{{ title }}</h1>
            <p v-if="description" class="text-sm text-muted-foreground mt-0.5">
              {{ description }}
            </p>
          </div>
        </div>

        <div v-if="actionButton" class="flex items-center gap-2">
          <Button
            :variant="actionButton.variant || 'default'"
            :disabled="actionButton.disabled || actionButton.loading"
            @click="handlePrimaryAction"
            class="touch-target"
          >
            <component
              v-if="actionButton.icon"
              :is="actionButton.icon"
              class="h-4 w-4 mr-2"
            />
            {{ actionButton.loading ? 'Saving...' : actionButton.label }}
          </Button>
        </div>
      </div>
    </div>

    <div
      v-if="tabs && tabs.length > 0"
      class="border-b bg-card px-4 sm:px-6"
    >
      <nav class="flex items-center gap-1 overflow-x-auto scrollbar-hide">
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

    <div
      v-if="showToolbar"
      class="border-b bg-card px-4 sm:px-6 py-3"
    >
      <slot name="toolbar">
        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <slot name="search">
              <input
                ref="searchInputRef"
                type="search"
                placeholder="Search... (Press / to focus)"
                class="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </slot>
          </div>

          <div class="flex flex-wrap gap-2">
            <slot name="filters" />
          </div>
        </div>
      </slot>
    </div>

    <main class="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
      <div class="animate-fadeIn">
        <slot />
      </div>
    </main>

    <div v-if="$slots.footer" class="border-t bg-card px-4 sm:px-6 py-3">
      <slot name="footer" />
    </div>
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
