# Routing Architecture

## Overview

SmartShopPOS uses Vue Router 4 with a layout-based route structure, role-aware guards, and lazy-loaded modules. The router enforces business rules like authentication and shift state before allowing navigation.

## Route Structure

```
/
├── /login                    → PublicAuthLayout
├── /register                 → PublicAuthLayout (future)
├── /shift                    → Layout (Opening Store workflow)
├── /                         → Layout (role-redirects to dashboard/pos)
│   ├── /pos                  → Layout > PosPage (POS checkout)
│   ├── /products             → Layout > ProductsPage (Catalog)
│   ├── /categories           → Layout > CategoriesPage (Catalog)
│   ├── /brands               → Layout > BrandsPage (Catalog)
│   ├── /cash-drawer          → Layout > CashDrawerPage (Finance)
│   ├── /customers            → Layout > CustomersPage (CRM)
│   ├── /reports/sales        → Layout > SalesReportsPage (Reports)
│   └── /theme-settings       → Layout > ThemeSettings (Settings)
```

## Layout System

Routes are wrapped in a `Layout.vue` component that provides:

- Sidebar navigation with workspace grouping
- Mobile-responsive overlay sidebar
- Top bar with organization branding
- Offline banner and network status
- Shift timer and cash drawer status

```typescript
// router/index.ts
const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('@/pages/LoginPage.vue') },
  {
    path: '/',
    component: () => import('@/layouts/Layout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/modules/dashboard/DashboardPage.vue') },
      ...catalogRoutes,
      ...salesRoutes,
      ...financeRoutes,
      ...shiftRoutes,
    ],
  },
];
```

## Navigation Guards

### Authentication Guard

```typescript
const publicPaths = ['/login', '/register'];

router.beforeEach((to) => {
  const auth = useAuthStore();
  const requiresAuth = !publicPaths.includes(to.path);

  if (requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' };
  }

  return true;
});
```

### Role-Based Redirect

```typescript
function getRoleRedirect(roles: string[]): string {
  if (roles.includes('Cashier')) return '/pos';
  if (roles.includes('Manager')) return '/';
  if (roles.includes('Accountant')) return '/reports/finance';
  if (roles.includes('Administrator')) return '/theme-settings';
  return '/';
}

// At `/` path, wait for roles to load to prevent infinite redirect
if (to.path === '/' && auth.isAuthenticated && auth.rolesLoaded && auth.roles.length > 0) {
  const redirect = getRoleRedirect(auth.roles);
  if (redirect !== '/') return { path: redirect };
}
```

### Shift State Guard

```typescript
// Protect `/pos` — require an open shift
if (to.path === '/pos' && auth.isAuthenticated) {
  const hasStoredShift = !!localStorage.getItem('shift');
  if (!shiftStore.isShiftOpen && !hasStoredShift) {
    return { path: '/shift' };
  }
}
```

## Module Routes

Each module can define its own routes:

### Sales Module (`modules/sales/router.ts`)

```typescript
export const salesRoutes: RouteRecordRaw[] = [
  { path: 'pos', name: 'pos', component: () => import('@/modules/sales/pages/PosPage.vue') },
  {
    path: 'pos/receipt/:id',
    name: 'pos-receipt',
    component: () => import('@/modules/sales/pages/ReceiptPage.vue'),
  },
];
```

### Shift Module

```typescript
// Route for the opening store workflow
{ path: 'shift', name: 'shift', component: () => import('@/modules/shift/ShiftWorkflow.vue') },
```

## Route Navigation

### Programmatic Navigation

```typescript
import { useRouter } from 'vue-router';
const router = useRouter();

function goToPos() {
  router.push('/pos');
}

function goToReceipt(id: string) {
  router.push({ name: 'pos-receipt', params: { id } });
}
```

### Link-Based Navigation

```vue
<RouterLink to="/products" class="nav-link">Products</RouterLink>
```

## Lazy Loading

All routes use dynamic imports for code splitting:

```typescript
component: () => import('@/modules/sales/pages/PosPage.vue');
```

This ensures only the needed JavaScript is loaded for the current route.

## Route Meta Fields

Routes can include metadata for access control:

```typescript
{
  path: 'pos',
  name: 'pos',
  component: PosPage,
  meta: {
    requiresShift: true,
    allowedRoles: ['Cashier', 'Manager']
  }
}
```

## Deep Linking

Routes support query parameters for preserved state:

```
/pos?category=dairy&search=milk
```

The POS page reads these on mount to restore context:

```typescript
const route = useRoute();
const category = route.query.category;
```

## Error Handling

- 404 (not found) → generic "Page Not Found" component
- 403 (forbidden) → redirects to dashboard with warning notification
- Unauthenticated → redirects to `/login`
