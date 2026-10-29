# UI Architecture

## Overview

The SmartShopPOS frontend is built on a **workspace architecture pattern** — a modular, domain-driven organization that scales from a single POS page to a full retail management suite.

## Directory Structure

```
src/
  modules/          # Domain modules (sales, catalog, pos, finance, etc.)
    {feature}/
      pages/        # Route-level views
      components/     # Feature-specific components
      composables/    # Vue composables (logic)
      stores/         # Pinia stores
      router.ts       # Feature-level routes
  components/
    ui/             # Reusable UI primitives (Button, Input, Card)
    business/       # Business-specific components (MoneyDisplay, StatusBadge)
  stores/           # Global stores (auth, theme, notification)
  layouts/          # App layouts (sidebar, header, mobile nav)
  shared/           # Shared types, API client, utilities
  assets/           # CSS, images, fonts
```

## Component Architecture

### UI Primitives (`components/ui/`)

Low-level, presentational components with no business logic:

| Component | Props                            | Slots                    |
| --------- | -------------------------------- | ------------------------ |
| `Button`  | variant, size, loading, disabled | default                  |
| `Input`   | type, placeholder, modelValue    | default                  |
| `Card`    | —                                | header, default, footer  |
| `Dialog`  | open                             | trigger, default, footer |

### Business Components (`components/business/`)

Higher-level components that combine UI primitives with business context:

| Component      | Purpose                                  |
| -------------- | ---------------------------------------- |
| `MoneyDisplay` | Formats KES currency, handles nulls      |
| `StatusBadge`  | Color-coded status indicators            |
| `KPIStatCard`  | Summary stat with icon and trend         |
| `ProductCard`  | Product display with image, price, stock |

### Module Components (`modules/*/components/`)

Feature-specific components co-located with their domain:

- `modules/sales/components/PaymentDrawer.vue` — POS payment flow
- `modules/sales/components/SearchBar.vue` — Universal product search
- `modules/sales/components/CartItem.vue` — Inline cart row

## State Management

### Global Stores (`stores/`)

- `auth` — Authentication state, user, roles, organizations
- `theme` — Dark/light mode, business branding, theme settings
- `notification` — Singleton toast service via vue-sonner
- `shift` — Cash drawer/shift state with localStorage persistence

### Feature Stores (`modules/*/stores/`)

- `useShiftStore` — Shift state, drawer status, opening float, timer

### Composables (`composables/`)

- `useCart` — Cart state with localStorage persistence (items, customer, payment method)
- `useSale` — Sale processing, suspend/resume
- `useGreeting` — Time-based greeting
- `useNetworkStatus` — Online/offline detection

### Server State (`@tanstack/vue-query`)

Server-fetched data uses react-query for caching, refetching, and background sync:

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['products-list'],
  queryFn: () => apiClient.get('/products'),
  staleTime: 60_000,
});
```

## Routing

The router uses a **layout-based** approach with role-aware navigation guards:

```typescript
// Role redirect at `/`
if (auth.isAuthenticated && auth.rolesLoaded && auth.roles.length > 0) {
  return { path: getRoleRedirect(auth.roles) };
}

// Shift guard at `/pos`
if (!shiftStore.isShiftOpen && !hasStoredShift) {
  return { path: '/shift' };
}
```

### Route Organization

Each module can export its own routes:

```
modules/
  catalog/router.ts  → salesRoutes
  sales/router.ts    → salesRoutes
  shift/             → /shift (opening workflow)
```

Routes are merged at the root level with a shared `Layout` component.

## Styling

### Tailwind CSS v4

Utility-first CSS with custom configuration in `src/assets/tailwind.css`:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn-vue/tailwind.css';
@import 'vue-sonner/style.css';
```

### CSS Variables

Theme variables are set via `document.documentElement.style.setProperty()`:

```css
:root {
  --color-primary: hsl(222.2, 47.4%, 11.2%);
  --color-background: hsl(0, 0%, 100%);
}
```

Dark mode uses `data-theme="dark"` attribute on `<html>`.

### Touch Targets

All interactive elements use the `touch-target` class to ensure minimum 44px tap targets on mobile:

```html
<button class="touch-target">...</button>
```

## Responsive Design

### Breakpoints

- `md` (768px) — Sidebar collapses to overlay
- `lg` (1024px) — Cart sidebar appears alongside products
- Desktop: Full 4-zone layout
- Mobile: Stacked layout with bottom action bar

### Mobile Patterns

- Sidebar: Fixed overlay with `translate-x` animation
- Top bar: Condensed with hamburger menu
- Form inputs: `h-12` minimum height for thumb-friendly interaction
- Buttons: Full-width on mobile, inline on desktop

## Data Flow

```
User Action
  → Component emits event
  → Composable handles business logic
  → API client sends request
  → Backend processes
  → Response handler
  → Notification service
  → Query cache invalidation
  → Components re-render
```

## Offline Support

- `useNetworkStatus` composable tracks `navigator.onLine`
- Offline banner shows at top of page
- Cart items persisted to localStorage (survives browser crash)
- Sales will sync when connection returns (placeholder for future implementation)
