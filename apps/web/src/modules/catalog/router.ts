import type { RouteRecordRaw } from 'vue-router';
import ProductsPage from './pages/ProductsPage.vue';
import ProductDetailPage from './pages/ProductDetailPage.vue';
import ProductWizard from './ProductWizard.vue';
import CategoriesPage from './pages/CategoriesPage.vue';
import BrandsPage from './pages/BrandsPage.vue';
import UnitsPage from './pages/UnitsPage.vue';
import TaxesPage from './pages/TaxesPage.vue';

export const catalogRoutes: RouteRecordRaw[] = [
  {
    path: 'products',
    name: 'products',
    component: ProductsPage,
    meta: { workspace: 'catalog', module: 'catalog' },
  },
  {
    path: 'products/create',
    name: 'products-create',
    component: ProductWizard,
    meta: { workspace: 'catalog', module: 'catalog' },
  },
  {
    path: 'products/:id',
    name: 'products-view',
    component: ProductDetailPage,
    meta: { workspace: 'catalog', module: 'catalog' },
  },
  {
    path: 'products/:id/edit',
    name: 'products-edit',
    component: ProductWizard,
    meta: { workspace: 'catalog', module: 'catalog' },
  },
  {
    path: 'categories',
    name: 'categories',
    component: CategoriesPage,
    meta: { workspace: 'catalog', module: 'catalog' },
  },
  {
    path: 'brands',
    name: 'brands',
    component: BrandsPage,
    meta: { workspace: 'catalog', module: 'catalog' },
  },
  {
    path: 'units',
    name: 'units',
    component: UnitsPage,
    meta: { workspace: 'catalog', module: 'catalog' },
  },
  {
    path: 'taxes',
    name: 'taxes',
    component: TaxesPage,
    meta: { workspace: 'catalog', module: 'catalog' },
  },
];
