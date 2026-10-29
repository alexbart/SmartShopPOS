# SmartShopPOS UI Guidelines

**Status:** Active — This is the design contract for the SmartShopPOS frontend. All contributors must follow these rules.

---

## 1. Mobile-First by Default

All layouts must be usable on a 375px viewport before anything else. Test on both 375px / iPhone SE and 1920px / desktop before shipping.

- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) — never the other way around.
- Tables become cards on `< 640px`. There is no horizontal scrolling of data tables on mobile.
- Touch targets are minimum 44×44px. Use `.touch-target` class when needed.
- Keyboard shortcut ⌘K / Ctrl+K focuses the universal search on every list page.

## 2. One Page Title + One Primary Action

Each page has exactly **one** `<h1>` and exactly **one primary action button**.

- The primary action is always rendered as a `shadcn/Button` with `variant="default"` and placed in the top-right corner of the page header.
- Secondary actions (Cancel, Reset) use `variant="outline"`.
- Destructive actions (Delete) use `variant="destructive"`.

## 3. Toast Feedback for Every Mutation

- **Every** create, update, or delete must trigger a toast via `notification.success()`, `notification.error()`, `notification.warning()`, or `notification.info()`.
- Backend errors are auto-handled by the axios interceptor (see `api-client.ts`).
- The toast `title` is the action; the `description` is the entity name (e.g., "Product deleted" / "Milk 500ml").

## 4. Lists Always Support Search + Pagination

Every list page must have:

- A **SmartSearch** component (universal: searches SKU, barcode, name, brand, category simultaneously).
- **Collapsible Filters** (collapsed on mobile, persistent on desktop).
- **Pagination** at the bottom (shadcn `Pagination` component).

## 5. Forms Have Inline Validation

- Use `vee-validate` + `zod` schemas for all form validation.
- Use shadcn `Form` / `FormItem` / `FormControl` / `FormLabel` / `FormMessage`.
- Validation errors show inline with the field, never in a modal or toast.

## 6. Tables Become Cards on Mobile

- On `sm:` (640px+) use the shadcn `<Table>` component.
- Below 640px, render the same data as `<Card>` components with key info visible.
- Each mobile card has an elbow menu (⋮) with edit/delete/actions.

## 7. No Business Logic Inside Components

- Components are **dumb** — they receive props and emit events.
- All API calls, data transformations, and state management live in:
  - **Composables** (`useProducts()`, `useCategories()`, etc.)
  - **Pinia stores** (`useProductStore()`, `useAuthStore()`, etc.)
  - Or inline `<script setup>` in the page component (if the logic is page-specific).

## 8. Reuse Before Creating

Before creating a new component:

1. Check `src/components/ui/` (shadcn components).
2. Check `src/components/business/` (reusable business components).
3. Only then create a new component.

## 9. Theme-Aware Colors Only

- Use `hsl(var(--color-*))` via Tailwind classes (e.g., `text-primary`, `bg-card`, `border`).
- **No hardcoded hex values** in components. All colors must come from the design token system.
- Status colors: use `status-badge-*` classes or the `StatusBadge` component.

## 10. Keyboard Accessibility

- All interactive elements are keyboard-navigable (`Tab`, `Enter`, `Space`, `Esc`).
- `Escape` closes dialogs, drawers, and popovers.
- Arrow keys navigate table rows and list items.
- `⌘K` / `Ctrl+K` opens search.

## 11. Consistent UI Skeleton

Every workspace page follows this skeleton (top to bottom):

```
Title (h1)
Breadcrumb (shadcn Breadcrumb)
Toolbar (primary action + secondary)
Filters (collapsible on mobile)
Table (desktop) / Cards (mobile)
Pagination
```

## 12. Workspace Architecture

### Workspace Structure

```
src/modules/<workspace>/
  components/       # Workspace-specific sub-components
  composables/      # Workspace-specific logic hooks
  stores/           # Optional: workspace Pinia stores
  *.vue             # Pages: List, Detail, Create/Edit, Wizard
```

### Workspace Pattern

1. **List Page** — table or cards, search, filters, bulk actions, pagination.
2. **Detail Page** — dedicated page with `<Tabs>` showing sub-entities.
3. **Wizard** — multi-step form for create/edit (use shadcn `Stepper`).
4. **Sub-entity List/Edit** — for child resources (e.g., product categories list).

### Workspaces

| Workspace  | Route Prefix                | Key Entities                               |
| ---------- | --------------------------- | ------------------------------------------ |
| Catalog    | `/products`, `/categories`  | Products, Categories, Brands, Units, Taxes |
| Inventory  | `/warehouses`, `/stock`     | Warehouses, Stock, Suppliers               |
| Purchasing | `/purchase-orders`          | POs, GRNs, Suppliers                       |
| Sales      | `/pos`, `/sales`            | Orders, Invoices, Returns                  |
| Finance    | `/cash-drawer`, `/expenses` | Cash flow, Expenses, Accounts              |
| Reporting  | `/reports/*`                | Financial, Sales, Inventory reports        |
| Workflow   | `/workflow/*`               | Pending approvals, audit trails            |

## 13. Naming Conventions

- **Components:** PascalCase (`ProductWizard.vue`)
- **Composables:** `usePrefixName()` (`useProducts()`)
- **Stores:** `useXStore` (`useProductStore`)
- **Types:** exported from `@/shared/types/index.ts`
- **API routes:** kebab-case (`/products/:id`)
