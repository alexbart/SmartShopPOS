# SmartShopPOS Frontend Principles

## State Management

- Never mutate server state directly. Always use Vue Query.
- Every API call has loading, success, and error states.
- Every mutation has toast feedback via the notification service.
- Stores (Pinia) never call APIs directly. Use composables for shared logic.

## Forms

- Every form validates with Zod (or VeeValidate).
- Inline errors displayed below each field.
- Loading buttons show spinner state.
- Success toast after submission.
- Unsaved changes warning before navigation.
- Mobile-first layout (single column on phone, grid on desktop).

## Data Display

- Every page has loading, empty, and error states.
- Skeleton loaders for async content.
- Tables become cards on phone screens (375px).
- Tables on tablet/desktop have horizontal overflow.
- Pagination with page size selector.
- Sortable columns with visual indicators.
- Filters collapse on mobile.

## Navigation

- Sidebar collapses to hamburger on mobile.
- Touch targets minimum 44px.
- Focus states visible on keyboard navigation.
- All interactive elements keyboard accessible.
- Labels on all form inputs.

## Accessibility

- Color contrast meets WCAG AA minimum.
- Keyboard navigation for all interactive elements.
- Focus rings visible on focus.
- Semantic HTML elements.
- ARIA labels where needed.

## Styling

- Use CSS variables (hsl format) for all colors. Never hardcode hex values.
- Reference variables: `hsl(var(--color-primary))`.
- Dark mode via `[data-theme="dark"]` attribute.
- Spacing on 4px/8px grid.
- Consistent border radius from `--radius` variable.
- Shadows from `--shadow-sm` to `--shadow-xl`.

## Notifications

- Use `notification.success/error/warning/info()` everywhere.
- Backend errors handled by axios interceptor automatically.
- Don't toast non-outcome actions (page changes, filters, sorting).

## Components

- Components stay presentation-focused. No API calls in components.
- Business logic in composables or services.
- Reuse components wherever possible.
- Every component documented in `docs/components/`.
