import type { RouteRecordRaw } from 'vue-router';

export const salesRoutes: RouteRecordRaw[] = [
  {
    path: 'pos',
    name: 'pos',
    component: () => import('@/modules/sales/pages/PosPage.vue'),
  },
  {
    path: 'pos/receipt/:id',
    name: 'pos-receipt',
    component: () => import('@/modules/sales/pages/ReceiptPage.vue'),
  },
];
