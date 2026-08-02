import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useShiftStore } from '@/modules/shift/stores/shiftStore';
import { catalogRoutes } from '@/modules/catalog/router';
import { salesRoutes } from '@/modules/sales/router';

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('@/modules/auth/LoginPage.vue') },
  { path: '/register', component: () => import('@/modules/auth/RegisterPage.vue') },
  {
    path: '/theme-settings',
    name: 'theme-settings',
    component: () => import('@/modules/auth/ThemeSettings.vue'),
  },
  {
    path: '/',
    component: () => import('@/layouts/Layout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/modules/dashboard/DashboardPage.vue'),
      },
      ...catalogRoutes,
      ...salesRoutes,
      {
        path: 'suppliers',
        name: 'suppliers',
        component: () => import('@/modules/inventory/SuppliersPage.vue'),
      },
      {
        path: 'warehouses',
        name: 'warehouses',
        component: () => import('@/modules/inventory/WarehousesPage.vue'),
      },
      {
        path: 'stock',
        name: 'stock',
        component: () => import('@/modules/inventory/StockPage.vue'),
      },
      {
        path: 'purchase-orders',
        name: 'purchase-orders',
        component: () => import('@/modules/purchasing/PurchaseOrdersPage.vue'),
      },
      {
        path: 'purchase-orders/create',
        name: 'purchase-orders-create',
        component: () => import('@/modules/purchasing/PurchaseOrderForm.vue'),
      },
      {
        path: 'purchase-orders/:id',
        name: 'purchase-orders-view',
        component: () => import('@/modules/purchasing/PurchaseOrderView.vue'),
      },
      { path: 'sales', name: 'sales', component: () => import('@/modules/sales/SalesPage.vue') },
      {
        path: 'customers',
        name: 'customers',
        component: () => import('@/modules/customers/CustomersPage.vue'),
      },
      {
        path: 'cash-drawer',
        name: 'cash-drawer',
        component: () => import('@/modules/finance/CashDrawerPage.vue'),
      },
      {
        path: 'shift',
        name: 'shift',
        component: () => import('@/modules/shift/ShiftWorkflow.vue'),
      },
      {
        path: 'expenses',
        name: 'expenses',
        component: () => import('@/modules/finance/ExpensesPage.vue'),
      },
      {
        path: 'banking',
        name: 'banking',
        component: () => import('@/modules/finance/BankingPage.vue'),
      },
      {
        path: 'reports/finance',
        name: 'reports-finance',
        component: () => import('@/modules/reports/FinanceReportsPage.vue'),
      },
      {
        path: 'reports/sales',
        name: 'reports-sales',
        component: () => import('@/modules/reports/SalesReportsPage.vue'),
      },
      {
        path: 'workflow/pending',
        name: 'workflow-pending',
        component: () => import('@/modules/workflow/PendingApprovals.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function getRoleRedirect(roles: string[]): string {
  if (roles.includes('Cashier') || roles.includes('cashier')) return '/pos';
  if (roles.includes('Manager') || roles.includes('manager')) return '/';
  if (roles.includes('Accountant') || roles.includes('accountant')) return '/reports/finance';
  if (roles.includes('Administrator') || roles.includes('administrator')) return '/theme-settings';
  return '/';
}

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const publicPaths = ['/login', '/register'];
  const requiresAuth = !publicPaths.includes(to.path);

  if (requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' };
  }

  if (to.path === '/') {
    if (auth.isAuthenticated && auth.rolesLoaded && auth.roles.length > 0) {
      const redirect = getRoleRedirect(auth.roles);
      if (redirect !== '/') return { path: redirect };
    }
    return true;
  }

  if (to.path === '/pos' && auth.isAuthenticated) {
    const shiftStore = useShiftStore();
    if (shiftStore.drawerStatus === 'loading') {
      await shiftStore.checkDrawerStatus();
    }
    if (!shiftStore.isShiftOpen) {
      return { path: '/shift' };
    }
  }

  return true;
});

export default router;
