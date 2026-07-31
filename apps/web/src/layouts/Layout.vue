<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const navigation = [
  { name: 'Dashboard', path: '/', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9l-4-4H5a2 2 0 00-2 2z' },
  { name: 'Products', path: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10a2 2 0 01-2 2h-2.5m-9.5 0a2 2 0 01-2-2V7' },
  { name: 'Suppliers', path: '/suppliers', icon: 'M17 8l4-4m0 0l-4-4m4 4H3' },
  { name: 'Purchase Orders', path: '/purchase-orders', icon: 'M16 15v-1m0 0v1zm0 0h-1m0 0l-5-5m5 5a2 2 0 100 4 2 2 0 000-4zm0 0V9a6 6 0 10-6 6v-4' },
  { name: 'POS', path: '/pos', icon: 'M3 3h2m1 0h6m2 0h2m1 0h2v2m-9 4h6m-6 0v6a2 2 0 11-4 0v-6m10 0h2m-2 0l-1.5-3h-5L9 10m-1-6h.01' },
  { name: 'Sales', path: '/sales', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Customers', path: '/customers', icon: 'M12 4.354a1 1 0 011 1.732l-1.732 1a1 1 0 01-1.732-.565V4.354a1 1 0 011-1.732l1.732 1a1 1 0 01.732.732z' },
  { name: 'Cash Drawer', path: '/cash-drawer', icon: 'M12 17V8m0 0l-3 3m3-3l3 3M9 20h6a3 3 0 100-6H9a3 3 0 100 6z' },
  { name: 'Expenses', path: '/expenses', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Reports', path: '/reports/sales', icon: 'M9 12h3.75M9 15h3.75M9 9h3.75' },
  { name: 'Approvals', path: '/workflow/pending', icon: 'M9 12l2 2 4-4m5.616 0c1.326-.774 2-2.24 2-3.853 0-2.761-2.239-5-5-5s-5 2.239-5 5c0 1.613.674 3.078 2 3.853' },
];

function navigate(path: string) {
  router.push(path);
}

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <nav class="w-64 bg-white shadow-sm flex flex-col">
      <div class="p-4 border-b">
        <h1 class="text-xl font-bold text-primary-600">SmartShopPOS</h1>
        <p class="text-sm text-gray-500">{{ auth.organization?.name }}</p>
      </div>

      <div class="flex-1 overflow-y-auto py-2">
        <button
          v-for="item in navigation"
          :key="item.path"
          @click="navigate(item.path)"
          class="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors"
          :class="router.currentRoute.value.path === item.path ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : ''"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          <span>{{ item.name }}</span>
        </button>
      </div>

      <div class="p-4 border-t">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span class="text-sm font-bold text-primary-600">
              {{ auth.user?.firstName?.[0] }}{{ auth.user?.lastName?.[0] }}
            </span>
          </div>
          <div>
            <p class="text-sm font-medium">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</p>
            <p class="text-xs text-gray-500">{{ auth.user?.email }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="w-full btn btn-secondary text-sm">
          Logout
        </button>
      </div>
    </nav>

    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
