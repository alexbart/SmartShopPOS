import type { RouteRecordRaw } from 'vue-router';

export const inventoryRoutes: RouteRecordRaw[] = [
  {
    path: 'inventory',
    name: 'inventory',
    component: () => import('@/modules/inventory/pages/InventoryPage.vue'),
    meta: { workspace: 'inventory', module: 'inventory' },
  },
];
