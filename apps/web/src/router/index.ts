import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

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
      {
        path: 'products',
        name: 'products',
        component: () => import('@/modules/catalog/ProductsPage.vue'),
      },
      {
        path: 'products/create',
        name: 'products-create',
        component: () => import('@/modules/catalog/ProductForm.vue'),
      },
      {
        path: 'products/:id',
        name: 'products-edit',
        component: () => import('@/modules/catalog/ProductForm.vue'),
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('@/modules/catalog/CategoriesPage.vue'),
      },
      {
        path: 'brands',
        name: 'brands',
        component: () => import('@/modules/catalog/BrandsPage.vue'),
      },
      { path: 'units', name: 'units', component: () => import('@/modules/catalog/UnitsPage.vue') },
      { path: 'taxes', name: 'taxes', component: () => import('@/modules/catalog/TaxesPage.vue') },
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
      { path: 'pos', name: 'pos', component: () => import('@/modules/sales/PosPage.vue') },
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

router.beforeEach((to) => {
  const auth = useAuthStore();
  const publicPaths = ['/login', '/register'];
  const requiresAuth = !publicPaths.includes(to.path);

  if (requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' };
  }

  return true;
});

export default router;
