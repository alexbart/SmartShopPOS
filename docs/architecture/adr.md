# UI Architecture Decision Records

## ADR-001: Workspace Architecture Pattern

**Status**: Accepted  
**Date**: 2026-08-01

### Context

The SmartShopPOS frontend needed a structure that could scale from a single POS screen to a full retail management suite with 10+ business modules (sales, catalog, inventory, finance, etc.).

### Decision

Adopt a domain-driven workspace architecture where each business domain is a self-contained module:

```
src/modules/
  {feature}/
    pages/        # Route-level views
    components/   # Feature-specific components
    composables/  # Business logic
    stores/       # Module state
    router.ts     # Module routes
```

Cross-cutting concerns live in shared locations:

- `src/components/ui/` — Design system primitives
- `src/components/business/` — Generic business components
- `src/stores/` — Global state (auth, theme, notification)
- `src/shared/` — Types, API client, utilities

### Consequences

- **Pro**: Modules are independently developable and testable
- **Pro**: Component boundaries are clear and intentional
- **Pro**: New developers can understand one module without knowing the whole system
- **Con**: Some shared concerns need careful dependency management
- **Con**: Cross-module features require coordination

## ADR-002: Pinia + localStorage for POS State Persistence

**Status**: Accepted  
**Date**: 2026-08-01

### Context

The POS checkout must survive browser crashes — a cashier should never lose a sale in progress.

### Decision

Use a hybrid approach:

1. **Pinia stores** for structured state (shift, auth, theme)
2. **localStorage** for cart persistence (items, customer, payment method)
3. **`watch()`** auto-syncs state to localStorage on changes

```typescript
const items = ref<PosCartItem[]>(loadCart());
watch(items, (newItems) => saveCart(newItems));
```

### Consequences

- **Pro**: Instant restore on page refresh
- **Pro**: No backend round-trip for state persistence
- **Con**: State can diverge across tabs (acceptable for single-cashier workflow)
- **Con**: localStorage size limits (acceptable — cart data is small)

## ADR-003: Slide-Up Payment Drawer

**Status**: Accepted  
**Date**: 2026-08-01

### Context

The POS payment flow previously used a modal dialog (`PaymentDialog.vue`). This was functional but disconnected the cashier from the cart context.

### Decision

Replace the modal dialog with a **slide-up payment drawer** (`PaymentDrawer.vue`) that:

- Slides up from the bottom of the screen
- Preserves the cart context behind it (dimmed but visible)
- Uses CSS transitions (no heavy animation library)
- Supports all payment methods (Cash, Card, M-Pesa, Bank, Split)

### Consequences

- **Pro**: Cashier maintains visual context of the cart
- **Pro**: Feels more like a POS terminal (drawer/slide)
- **Pro**: Keyboard-accessible with Escape to close
- **Con**: Takes more vertical space on mobile (acceptable — mobile uses list view)

## ADR-004: Role-Based Routing with Async Roles

**Status**: Accepted  
**Date**: 2026-08-01

### Context

Different user roles (Cashier, Manager, Accountant, Administrator) should land on different pages after login. Roles are fetched asynchronously via `fetchMe()`.

### Decision

1. Use a `rolesLoaded` flag in the auth store
2. Gate role-based redirects until roles are loaded
3. Check `localStorage` for persisted shift state in router guards

```typescript
if (to.path === '/' && auth.isAuthenticated && auth.rolesLoaded && auth.roles.length > 0) {
  return { path: getRoleRedirect(auth.roles) };
}
```

### Consequences

- **Pro**: Prevents infinite redirect loops
- **Pro**: Works in both component and router guard context
- **Con**: Adds one extra concept (`rolesLoaded`) to the auth store
- **Con**: Router guards may briefly allow rendering before redirect (acceptable)

## ADR-005: Client-Side Search with Instant Filtering

**Status**: Accepted  
**Date**: 2026-08-01

### Context

The POS search needs to feel instantaneous — typing "mil" should instantly show "Milk 500ml", "Milk 1L", "Milk Powder".

### Decision

Use client-side filtering via `computed` properties:

```typescript
const filteredProducts = computed(() => {
  let result = products.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter((p) => matchesSearch(p, q));
  }
  if (selectedCategory.value) {
    result = result.filter((p) => p.categoryId === selectedCategory.value);
  }
  return result;
});
```

Products are loaded once via `useQuery` (stale for 60s), then all filtering is client-side.

### Consequences

- **Pro**: Sub-10ms filtering response
- **Pro**: No loading spinners during typing
- **Con**: Requires all products in memory (acceptable for typical inventory <5000 items)
- **Con**: Stale data for 60s (acceptable for POS context)
