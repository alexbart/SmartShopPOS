<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { ref } from 'vue';

const router = useRouter();
const auth = useAuthStore();
const theme = useThemeStore();
const sidebarOpen = ref(false);

const navigation = [
  { name: 'Dashboard', path: '/', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9l-4-4H5a2 2 0 00-2 2z' },
  { name: 'Products', path: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10a2 2 0 01-2 2h-2.5m-9.5 0a2 2 0 01-2-2V7' },
  { name: 'Suppliers', path: '/suppliers', icon: 'M17 8l4-4m0 0l-4-4m4 4H3' },
  { name: 'Purchase Orders', path: '/purchase-orders', icon: 'M16 15v-1m0 0v1zm0 0h-1m0 0l-5-5m5 5a2 2 0 100 4 2 2 0 000-4zm0 0V9a6 6 0 10-6 6v-4' },
  { name: 'POS', path: '/pos', icon: 'M3 3h2m1 0h6m2 0h2m1 0h2v2m-9 4h6m-6 0v6a2 2 0 11-4 0v-6m10 0h2m-2 0l-1.5-3h-5L9 10m-1-6h.01' },
  { name: 'Sales', path: '/sales', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Customers', path: '/customers', icon: 'M12 4.354a1 1 0 011 1.732l-1.732 1a1 1 0 01-1.732-.565V4.354a1 1 0 011-1.732l1.732 1a1 1 0 01.732.732z' },
  { name: 'Cash Drawer', path: '/cash-drawer', icon: 'M12 17V8m0 0l-3 3m3-3l3 3M9 20h6a3 3 0 100-6H9a3 3 0 010 6z' },
  { name: 'Expenses', path: '/expenses', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Reports', path: '/reports/sales', icon: 'M9 12h3.75M9 15h3.75M9 9h3.75' },
  { name: 'Approvals', path: '/workflow/pending', icon: 'M9 12l2 2 4-4m5.616 0c1.326-.774 2-2.24 2-3.853 0-2.761-2.239-5-5-5s-5 2.239-5 5c0 1.613.674 3.078 2 3.853' },
  { name: 'Theme', path: '/theme-settings', icon: 'M11.983 2.167c.325 0 .647.06 1.02.177.8.208 1.26.978 1.062 1.806a1 1 0 01-.999.757H11c-.192 0-.407-.012-.622-.035a.75.75 0 0 1-.359-.22L8.818 4.94a.933.933 0 0 0-1.566.555v1.5c0 .314.033.636.096.957A2.25 2.25 0 0 0 9.983 9.5' },
];

function navigate(path: string) {
  router.push(path);
  if (window.innerWidth < 768) sidebarOpen.value = false;
}

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-40 md:hidden"
      @click="sidebarOpen = false"
    ></div>

    <nav
      :class="[
        'fixed md:static z-40 h-full bg-card shadow-sm flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'w-64',
      ]"
    >
      <div class="p-4 border-b">
        <h1
          class="text-xl font-bold"
          style="color: hsl(var(--color-primary))"
        >
          {{ auth.organization?.name || theme.theme.businessName || 'SmartShopPOS' }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ auth.user?.firstName }} {{ auth.user?.lastName }}
        </p>
      </div>

      <div class="flex-1 overflow-y-auto py-2">
        <button
          v-for="item in navigation"
          :key="item.path"
          @click="navigate(item.path)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-md mx-2 my-0.5 transition-colors touch-target',
            router.currentRoute.value.path === item.path
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-gray-600 hover:bg-muted',
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          {{ item.name }}
        </button>
      </div>

      <div class="p-4 border-t">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 rounded-md hover:bg-muted transition-colors touch-target"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6-10V7a4 4 0 00-4-4h-1" />
          </svg>
          Logout
        </button>
      </div>
    </nav>

    <main class="flex-1 overflow-y-auto">
      <div class="md:hidden p-3 border-b flex items-center justify-between">
        <button
          @click="sidebarOpen = true"
          class="p-2 rounded-lg hover:bg-muted text-gray-600 touch-target"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 class="font-bold text-lg">
          {{ auth.organization?.name || 'SmartShopPOS' }}
        </h1>
        <div class="w-10"></div>
      </div>

      <RouterView />
    </main>
  </div>
</template>

<style>
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
</style>
