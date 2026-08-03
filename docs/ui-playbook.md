# SmartShopPOS UI Playbook

The UI contract for the project. Every new screen must feel like it belongs to the same product.

---

## Page Layouts

### POS Workspace
Full-height (`h-[calc(100vh-4rem)]`), no scroll on the outer shell. Two-column split:
- Left: product browser (flex-1, scrollable internally)
- Right: cart panel (fixed `w-[360px]`, scrollable items list)

Top bar is always visible and never scrolls. Bottom action buttons are always pinned.

### Workspace Pages (Catalog, Inventory, Reports)
Standard layout: page header + content area with `overflow-y-auto`. Use `max-w-7xl mx-auto px-6` for content width.

### Dialogs
- Confirmation dialogs: shadcn `Dialog`, max-w-sm, centered.
- Form dialogs: shadcn `Dialog`, max-w-lg or max-w-2xl depending on field count.
- Payment: centered modal overlay (`items-center justify-center`), max-w-lg, scale+fade animation.
- Never use bottom sheets on desktop.

### Drawers / Slide-overs
Reserved for contextual detail panels (e.g. order detail, product detail). Slide in from the right. Width: `w-[480px]`.

---

## Spacing Scale

Follow Tailwind's default scale. Preferred values:
- Component internal padding: `p-4` or `p-6`
- Gap between sibling components: `gap-4`
- Section spacing inside a card: `space-y-4`
- Tight rows (table rows, list items): `py-2 px-3`
- Icon-to-label gap: `gap-1.5` or `gap-2`

---

## Card Patterns

```
<Card>
  <CardHeader>          ← optional, use for titled sections
  <CardContent class="pt-4">
  <CardFooter>          ← optional, use for actions
```

- Cards have `border` and `bg-card`. Never add extra shadow unless on hover.
- Hover elevation: `hover:shadow-md hover:border-primary transition-all`
- Dashed border (`border-dashed`) for placeholder/empty-state cards.

---

## Drawer Behavior

- Drawers are triggered by a button, never auto-open.
- Always include a close button (X icon, top-right).
- Click outside (`@click.self`) closes the drawer.
- Esc key closes the active drawer/dialog.
- Only one drawer open at a time.
- Animate: `transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.

---

## Dialog Rules

- Use `Dialog` from shadcn-vue.
- Always emit `close` on `@update:open="emit('close')"`.
- Destructive actions use a red confirm button (`variant="destructive"`).
- Never nest dialogs.

---

## Table Conventions

- Use shadcn `Table` components.
- Always show a skeleton loader (5–10 rows of `animate-pulse` divs) while loading.
- Empty state: centered icon + heading + subtext. Never an empty table body.
- Pagination: show `Showing X–Y of Z` text. Use `limit` of 20 by default.
- Sortable columns: chevron icon, toggled on click.

---

## Toast Guidelines

Use `vue-sonner` via the `notification` store helper:

```ts
notification.success('Title', 'Optional description')
notification.error('Title', 'Description')
notification.warning('Title', 'Description')
notification.info('Title', 'Description')
```

- Success: after completing an action (sale, save, delete).
- Error: after a failed API call. Always include a recovery hint.
- Warning: for soft guards (out of stock, shift not open).
- Info: for neutral state changes (suspended, restored).
- Never show more than one toast for a single user action.

---

## Form Validation Patterns

- Use `vee-validate` with `useForm` / `useField`.
- Show errors inline below each field, not in a banner.
- Disable submit button while `isSubmitting` is true.
- On success: reset form or navigate away — never leave stale data.
- shadcn `Select` components: use `{ value, handleChange }` slot pattern with `:model-value` / `@update:model-value`. Do NOT use `v-bind="componentField"`.

---

## Mobile Breakpoints

| Breakpoint | Width   | Usage                          |
|------------|---------|--------------------------------|
| `sm`       | 640px   | Stack columns, hide labels     |
| `md`       | 768px   | Tablet layout                  |
| `lg`       | 1024px  | Standard desktop               |
| `xl`       | 1280px  | Wide desktop, expanded grids   |

POS product grid columns: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`

Touch targets: minimum `h-10 w-10` (`touch-target` utility class). On mobile, prefer `h-12`.

---

## Keyboard Shortcuts

### POS Workspace

| Key        | Action                  |
|------------|-------------------------|
| F2         | Focus search bar        |
| F3         | Focus customer lookup   |
| F4         | Hold / suspend sale     |
| F5         | Resume suspended sale   |
| F6         | Open payment drawer     |
| F7         | Apply discount          |
| F9         | Clear cart              |
| F10        | Complete sale           |
| Esc        | Close active dialog     |
| Ctrl+Del   | Clear cart              |
| Enter      | Complete sale (if cart not empty, no dialog open) |

Shortcuts must not fire when focus is inside an `INPUT`, `TEXTAREA`, or `contenteditable` element — except for F2/F3 which always redirect focus.

---

## Color-Coded Status Badges

| Status      | Classes                                                      |
|-------------|--------------------------------------------------------------|
| Open/Active | `bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400` |
| Closed      | `bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400`         |
| Pending     | `bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400` |
| Draft       | `bg-muted text-muted-foreground`                             |
| Returned    | `bg-secondary text-secondary-foreground`                     |

Use `rounded-full px-2 py-0.5 text-xs font-medium` for inline badges.

---

## Skeleton Loaders

Always show skeletons, never spinners, for page-level data loading.

```html
<div class="animate-pulse">
  <div class="h-4 bg-muted rounded w-3/4 mb-2" />
  <div class="h-4 bg-muted rounded w-1/2" />
</div>
```

For grids: render 10–15 skeleton tiles matching the real tile dimensions.
For tables: render 5–8 skeleton rows.
For cards: render a single skeleton matching the card's content structure.

---

## Offline / Network Status

Always show network status in the POS top bar:
- 🟢 Online: `text-green-600` + `Wifi` icon
- 🔴 Offline: `text-red-600` + `WifiOff` icon

Offline mode UI is prepared but sync is not yet implemented. Do not block the UI when offline — queue actions and show a sync indicator when back online.
