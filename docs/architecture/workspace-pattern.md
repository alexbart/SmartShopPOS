# Workspace Pattern

## Overview

SmartShopPOS uses a **domain-driven workspace architecture** — each major business area is a self-contained module with its own pages, components, composables, and stores. This keeps features isolated and independently scalable.

## Structure

```
src/modules/
  sales/
    pages/
      PosPage.vue
      ReceiptPage.vue
    components/
      CartItem.vue
      CartSummary.vue
      CustomerLookup.vue
      PaymentDialog.vue
      PaymentDrawer.vue
      PaymentSelector.vue
      ProductGrid.vue
      ProductTile.vue
      ProductShortcuts.vue
      QuickActions.vue
      ReceiptPreview.vue
      RecentSales.vue
      SearchBar.vue
      SuspendSaleDialog.vue
    composables/
      types.ts
      useCart.ts
      useSale.ts
    stores/
      shiftStore.ts
    router.ts
```

## Module Lifecycle

### 1. Routing

Each module can export its own route definitions:

```typescript
// modules/sales/router.ts
export const salesRoutes: RouteRecordRaw[] = [
  { path: 'pos', name: 'pos', component: () => import('@/modules/sales/pages/PosPage.vue') },
  {
    path: 'pos/receipt/:id',
    name: 'pos-receipt',
    component: () => import('@/modules/sales/pages/ReceiptPage.vue'),
  },
];
```

Routes are merged at the root router level:

```typescript
// router/index.ts
import { salesRoutes } from '@/modules/sales/router';
const routes: RouteRecordRaw[] = [
  { path: '/', component: Layout, children: [...salesRoutes] },
  // ...other modules
];
```

### 2. State Isolation

Each module manages its own state independently:

- Global concerns → `src/stores/` (auth, theme, notification)
- Module concerns → `modules/{feature}/stores/` (shift, cart)
- Server state → `@tanstack/vue-query` with scoped query keys

### 3. Composables

Business logic lives in composables, not components:

```typescript
export function useCart() {
  const items = ref<PosCartItem[]>(loadCart());
  const addItem = (product: Product, quantity: number = 1) => { ... };
  // auto-persists to localStorage
  return { items, addItem, ... };
}
```

## Component Layers

### Cross-Module Components

Shared across all workspaces in `src/components/`:

- `ui/` — Design system primitives (Button, Input, Card, Dialog)
- `business/` — Generic business components (MoneyDisplay, StatusBadge)

### Module-Specific Components

Co-located within `modules/{feature}/components/`:

- Feature-specific UI (PaymentDrawer, ReceiptPreview, SearchBar)
- Can import cross-module components freely

### Pages

Entry points at `modules/{feature}/pages/`:

- Define the full layout for a route
- Compose module-specific components
- Handle route-level concerns (params, navigation)

## Data Flow Within a Module

```
Page.vue (route entry)
  ↓
Composable (useCart, useSale)
  ↓
API Client (@/shared/lib/api-client)
  ↓
Backend API (/api/v1/...)
  ↓
Response → useQuery cache → Component re-renders
Actions → useMutation → invalidateQueries → Cache update
```

## State Persistence

### Critical Business State

- Cart items → localStorage key: `pos-cart`
- Customer selection → localStorage key: `pos-state`
- Shift status → localStorage key: `shift`
- Pinned products → localStorage key: `pos-pinned-products`

### Session State

- Auth tokens → localStorage keys: `accessToken`
- User data → localStorage key: `user`

All persisted state auto-syncs: changes to refs trigger localStorage writes via `watch()`.

## Error Boundaries

Components handle errors gracefully:

- API errors → axios interceptor → notification.error()
- Loading states → skeleton screens
- Empty states → friendly messages with actions
- Offline → banner + localStorage fallback

## Cross-Module Communication

Modules communicate through:

1. **Events** — Child to parent via `emit`
2. **Shared stores** — Global state via `src/stores/`
3. **Query invalidation** — Cache updates via `queryClient.invalidateQueries()`
4. **Router** — Navigation between modules via `useRouter()`

## Adding a New Workspace

To create a new module:

1. Create `src/modules/{feature}/`
2. Add `pages/`, `components/`, `composables/` subdirectories
3. Create `router.ts` exporting routes
4. Register routes in `src/router/index.ts`
5. Add to navigation in `Layout.vue`
6. Create Pinia store if module state is needed
