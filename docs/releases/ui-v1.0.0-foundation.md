# SmartShopPOS UI Foundation

**Date:** 2026-08-01

## Summary

The frontend reached a stable application shell, transforming SmartShopPOS from "a backend with a frontend" into a cohesive product. This foundation includes a notification system, design system with CSS variables, reusable component library, theme customization, and mobile-first responsive layouts.

## Major Features

### Notification System

- Singleton `notification` service with `success()`, `error()`, `warning()`, `info()` methods
- Auto-dismiss toast component with type-colored variants
- Axios response interceptor for automatic backend error handling
- Integrated across all user-facing actions (login, product CRUD, sales, approvals, theme settings)

### Design System

- Tailwind CSS 4 with proper HSL CSS variables
- Dark mode via `[data-theme="dark"]` attribute
- Theme variables for all colors, radius, shadows, typography
- `@tailwindcss/postcss` for Tailwind v4 compatibility

### Reusable UI Components (`src/components/ui/`)

- **AppButton** — variants (primary/secondary/ghost/outline), sizes, loading state
- **AppInput** — labeled input with error state
- **AppSelect** — dropdown with transitions
- **AppAlert** — type-colored alert banners
- **SearchInput** — search with clear button and debounce

### Business Components (`src/components/business/`)

- **MoneyDisplay** — KES currency formatting
- **StatusBadge** — status pills (pending, approved, rejected, etc.)
- **InventoryBadge** — stock level indicators (out/low/good)
- **ProductCard** — product display with hover actions
- **KPIStatCard** — metric cards with trend indicators
- **PaymentMethodChip** — payment method badges
- **ApprovalCard** — approval request badges

### Theme Customization (Backend + Frontend)

- `OrganizationTheme` Prisma model with fields: primaryColor, secondaryColor, accentColor, logoUrl, faviconUrl, themeMode, borderRadius, fontFamily, compactMode
- API endpoints: `GET /api/v1/theme`, `PATCH /api/v1/theme`
- Branding & Appearance settings page with live preview

### Mobile-First Design

- Responsive sidebar with drawer overlay on mobile (hamburger menu)
- Touch targets (44px minimum) on all interactive elements
- Loading skeletons and empty states on all pages

## Architecture Decisions

- Notification service as singleton (not Pinia store) for use outside Vue setup
- Theme state split: local `editableTheme` for editing, global `themeStore` for live state
- CSS variables updated via `document.documentElement.style.setProperty()` for live preview
- Theme loads from backend on app mount, falls back to localStorage
- ESLint config separated for frontend (`.ts` prettier only) vs backend (`.ts` eslint + prettier)

## Known Limitations

- No contrast checking (WCAG) in color picker
- No module renaming (e.g., "Patients" instead of "Customers")
- No theme versioning (no Save as Draft / Publish)
- No "Preview as Customer" mode
- Theme settings not yet persisted to database from frontend (saveTheme calls API but fallback to localStorage)

## Next Milestone

`ui-v1.1.0-catalog` — Complete catalog workspace (Categories, Brands, Units, Taxes, Products) with search, filters, pagination, bulk actions, responsive tables, skeleton loaders, and optimistic updates.

## Next Feature Branch

`feature/catalog-workspace` — The complete catalog workspace, not just individual pages.
