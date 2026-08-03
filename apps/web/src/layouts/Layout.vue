<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router';
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useShiftStore } from '@/modules/shift/stores/shiftStore';
import { useGreeting } from '@/modules/shift/composables/useGreeting';
import {
  LayoutDashboard,
  Package,
  Tag,
  Layers,
  Box,
  Percent,
  ShoppingCart,
  BarChart3,
  Users,
  Warehouse,
  Receipt,
  CreditCard,
  Clock,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Printer,
  QrCode,
} from '@lucide/vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const theme = useThemeStore();
const shiftStore = useShiftStore();
const { greeting } = useGreeting();
const sidebarOpen = ref(false);
const isOnline = ref(true);
const isMobileView = ref(false);

const isMainView = computed(() => {
  const mainRoutes = ['/', '/products', '/pos', '/customers', '/dashboard'];
  return mainRoutes.includes(route.path);
});

function checkMobile() {
  isMobileView.value = window.innerWidth < 768;
}

onMounted(() => {
  checkMobile();
  isOnline.value = navigator.onLine;
  window.addEventListener('resize', checkMobile);
  window.addEventListener('online', () => (isOnline.value = true));
  window.addEventListener('offline', () => (isOnline.value = false));
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('online', () => (isOnline.value = true));
  window.removeEventListener('offline', () => (isOnline.value = false));
});
const expandedWorkspaces = reactive<Record<string, boolean>>({
  catalog: true,
});

onMounted(() => {
  isOnline.value = navigator.onLine;
  window.addEventListener('online', () => (isOnline.value = true));
  window.addEventListener('offline', () => (isOnline.value = false));
});

onUnmounted(() => {
  window.removeEventListener('online', () => (isOnline.value = true));
  window.removeEventListener('offline', () => (isOnline.value = false));
});

const topLevelNavigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
];

const workspaces = [
  {
    name: 'Catalog',
    icon: Package,
    key: 'catalog',
    hasChildren: true,
    children: [
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Categories', path: '/categories', icon: Tag },
      { name: 'Brands', path: '/brands', icon: Layers },
      { name: 'Units', path: '/units', icon: Box },
      { name: 'Taxes', path: '/taxes', icon: Percent },
    ],
  },
  { name: 'Inventory', path: '/inventory', icon: Warehouse },
  { name: 'Purchasing', path: '/purchase-orders', icon: Receipt },
  { name: 'Sales', path: '/pos', icon: ShoppingCart },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Finance', path: '/cash-drawer', icon: CreditCard },
  { name: 'Reports', path: '/reports/sales', icon: BarChart3 },
  { name: 'Approvals', path: '/workflow/pending', icon: Clock },
  { name: 'Theme', path: '/theme-settings', icon: Settings },
];

function isChildActive(path: string | undefined): boolean {
  if (!path) return false;
  return router.currentRoute.value.path === path;
}

function isWorkspaceActive(ws: any): boolean {
  if (ws.path) return isChildActive(ws.path);
  return ws.children?.some((c: any) => isChildActive(c.path)) ?? false;
}

function navigate(path: string) {
  router.push(path);
  if (window.innerWidth < 768) sidebarOpen.value = false;
}

function toggleWorkspace(key: string) {
  expandedWorkspaces[key] = !expandedWorkspaces[key];
}

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="flex h-screen">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-40 md:hidden"
      @click="sidebarOpen = false"
    ></div>

    <nav
      class="fixed md:static z-50 h-full bg-card shadow border-r border-border flex flex-col transition-transform duration-200"
      :class="
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      "
    >
      <div class="p-4 border-b">
        <h1
          class="text-xl font-bold"
          :style="{ color: 'hsl(var(--color-primary))' }"
        >
          {{ auth.organization?.name || theme.theme.businessName || 'SmartShopPOS' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ auth.user?.firstName }} {{ auth.user?.lastName }}
        </p>
      </div>

      <div class="flex-1 overflow-y-auto py-2">
        <button
          v-for="item in topLevelNavigation"
          :key="item.path"
          @click="navigate(item.path)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-md mx-2 my-0.5 transition-colors touch-target',
            isChildActive(item.path)
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted',
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ item.name }}</span>
        </button>

        <div v-for="ws in workspaces" :key="ws.name">
          <button
            v-if="ws.hasChildren"
            @click="toggleWorkspace(ws.key)"
            :class="[
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-md mx-2 my-0.5 transition-colors touch-target',
              isWorkspaceActive(ws)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted',
            ]"
          >
            <component :is="ws.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ ws.name }}</span>
            <ChevronDown
              v-if="expandedWorkspaces[ws.key]"
              class="w-4 h-4 ml-auto transition-transform"
            />
            <ChevronRight
              v-else
              class="w-4 h-4 ml-auto transition-transform"
            />
          </button>

          <template v-else>
            <button
               @click="navigate(ws.path!)"
              :class="[
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-md mx-2 my-0.5 transition-colors touch-target',
                isChildActive(ws.path)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted',
              ]"
            >
              <component :is="ws.icon" class="w-5 h-5 flex-shrink-0" />
              <span>{{ ws.name }}</span>
            </button>
          </template>

          <div
            v-if="ws.hasChildren && expandedWorkspaces[ws.key]"
            class="ml-8 mt-1 space-y-1"
          >
            <button
              v-for="child in ws.children"
              :key="child.path"
              @click="navigate(child.path)"
              :class="[
                'w-full flex items-center gap-3 px-4 py-2 text-sm rounded-md mx-2 my-0.5 transition-colors touch-target',
                isChildActive(child.path)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted',
              ]"
            >
              <component :is="child.icon" class="w-4 h-4 flex-shrink-0" />
              <span>{{ child.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="p-4 border-t">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground rounded-md hover:bg-muted transition-colors touch-target"
        >
          <LogOut class="w-5 h-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </nav>

     <main class="flex-1 overflow-y-auto">
      <div v-if="!isOnline" class="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 px-4 py-2">
        <div class="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
          <WifiOff class="w-4 h-4" />
          <span>You're offline. Sales will sync when connection returns.</span>
        </div>
      </div>

      <div class="md:hidden p-3 border-b flex items-center justify-between">
        <button
          @click="sidebarOpen = true"
          class="p-2 rounded-lg hover:bg-muted text-muted-foreground touch-target"
        >
          <Menu class="w-6 h-6" />
        </button>
        <h1 class="font-bold text-lg">
          {{ auth.organization?.name || 'SmartShopPOS' }}
        </h1>
        <div class="flex items-center gap-2">
          <div
            v-if="shiftStore.isShiftOpen"
            class="text-xs text-muted-foreground"
          >
            {{ greeting.text }}
          </div>
          <div :class="isOnline ? 'text-green-600' : 'text-red-600'">
            <Wifi v-if="isOnline" class="w-4 h-4" />
            <WifiOff v-else class="w-4 h-4" />
          </div>
        </div>
      </div>

      <div
        v-if="!isMobileView && isMainView && shiftStore.isShiftOpen"
        class="border-b px-4 py-2 bg-card flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-4 text-sm">
          <span class="text-muted-foreground">Shift</span>
          <span class="font-mono font-medium">{{ shiftStore.shiftDuration }}</span>
          <span class="text-muted-foreground">Cashier</span>
          <span class="font-medium">{{ auth.user?.firstName }}</span>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">Float</span>
            <span class="font-medium">KES {{ shiftStore.shift?.openingFloat.toLocaleString() }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Printer class="w-4 h-4 text-muted-foreground" />
            <span class="text-muted-foreground">Printer</span>
            <span class="font-medium text-green-600">Ready</span>
          </div>
          <div class="flex items-center gap-1">
            <QrCode class="w-4 h-4 text-muted-foreground" />
            <span class="text-muted-foreground">Scanner</span>
            <span class="font-medium text-green-600">Connected</span>
          </div>
        </div>
      </div>

      <RouterView />
    </main>
  </div>
</template>
