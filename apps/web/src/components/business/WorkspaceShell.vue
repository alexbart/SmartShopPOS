<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Sun, ChevronDown, Menu } from '@lucide/vue';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth';

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
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

interface ToolbarAction {
  label: string;
  icon?: any;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  onClick: () => void;
}

const props = withDefaults(
  defineProps<{
    breadcrumbs?: BreadcrumbItem[];
    workspaceIcon?: any;
    workspaceTitle: string;
    workspaceDescription?: string;
    actionButton?: WorkspaceAction;
    tabs?: TabItem[];
    activeTab?: string;
    toolbarActions?: ToolbarAction[];
    showToolbar?: boolean;
  }>(),
  {
    breadcrumbs: () => [],
    actionButton: undefined,
    tabs: () => [],
    activeTab: undefined,
    toolbarActions: () => [],
    showToolbar: true,
  },
);

const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void;
  (e: 'action', value: string): void;
}>();

const router = useRouter();
const auth = useAuthStore();
const sidebarOpen = ref(false);

const userName = computed(() => {
  const firstName = auth.user?.firstName ?? '';
  const lastName = auth.user?.lastName ?? '';
  return `${firstName} ${lastName}`.trim() || 'User';
});

function handleTabChange(value: string) {
  emit('update:activeTab', value);
}

const searchQuery = ref('');
</script>

<template>
  <div class="flex h-screen flex-col">
    <header class="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 sm:px-6">
      <div class="flex items-center gap-2">
        <button
          v-if="$slots.sidebarToggle || sidebarOpen"
          @click="sidebarOpen = true"
          class="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted touch-target"
        >
          <Menu class="h-5 w-5" />
        </button>

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

      <div class="flex items-center gap-2">
        <button
          class="rounded-lg p-2 text-muted-foreground hover:bg-muted touch-target"
          title="Notifications"
        >
          <Bell class="h-4 w-4" />
        </button>
        <button
          class="rounded-lg p-2 text-muted-foreground hover:bg-muted touch-target"
          title="Toggle theme"
        >
          <Sun class="h-4 w-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted touch-target"
            >
              <span class="hidden sm:inline">{{ userName }}</span>
              <ChevronDown class="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuLabel>{{ auth.organization?.name || 'My Account' }}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem @click="router.push('/theme-settings')">
                Theme Settings
              </DropdownMenuItem>
              <DropdownMenuItem @click="auth.logout()">
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <div v-if="workspaceTitle || actionButton" class="border-b bg-card px-4 sm:px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <component
            v-if="workspaceIcon"
            :is="workspaceIcon"
            class="h-6 w-6 text-primary"
          />
          <div>
            <h1 class="text-2xl font-bold">{{ workspaceTitle }}</h1>
            <p v-if="workspaceDescription" class="text-sm text-muted-foreground mt-0.5">
              {{ workspaceDescription }}
            </p>
          </div>
        </div>

        <div v-if="actionButton" class="flex items-center gap-2">
          <div v-if="actionButton.icon" class="mr-1">
            <component :is="actionButton.icon" class="h-4 w-4" />
          </div>
          <button
            :disabled="actionButton.disabled || actionButton.loading"
            @click="actionButton.onClick"
            class="btn btn-primary touch-target"
          >
            {{ actionButton.loading ? 'Saving...' : actionButton.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="tabs && tabs.length > 0" class="border-b bg-card px-4 sm:px-6">
      <nav class="flex items-center gap-6 overflow-x-auto scrollbar-hide" style="scroll-behavior: smooth">
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
          <span
            v-if="tab.count !== undefined && Number(tab.count) > 0"
            class="bg-muted text-muted-foreground text-xs rounded-full px-1.5 py-0.25"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>
    </div>

    <div v-if="showToolbar" class="border-b bg-card px-4 sm:px-6 py-3">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="relative flex-1 min-w-[180px]">
          <slot name="search">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </slot>
        </div>

        <div class="flex flex-wrap gap-2">
          <slot name="filters">
            <button
              v-for="action in toolbarActions"
              :key="action.label"
              @click="action.onClick"
              class="btn btn-outline btn-sm touch-target"
            >
              <component v-if="action.icon" :is="action.icon" class="h-3 w-3 mr-1" />
              {{ action.label }}
            </button>
          </slot>
        </div>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
      <slot />
    </main>
  </div>
</template>
