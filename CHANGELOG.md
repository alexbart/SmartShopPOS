# Changelog

All notable changes to SmartShopPOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0] — 2026-08-01

### Summary

SmartShopPOS v1.1.0 represents the UI Foundation milestone — transitioning the project from a backend API with a minimal frontend into a production-ready retail application shell. This release establishes the workspace architecture pattern, mobile-first responsive design, theme customization system, notification service, and the Opening Store workflow.

### Added

#### Workspace Architecture

- Mobile-first responsive layout with sidebar navigation (Layout.vue)
- Role-aware routing: Cashier → POS, Manager → Dashboard, Accountant → Finance, Admin → Settings
- Workspace pattern: `src/modules/{feature}/` with `pages/`, `components/`, `composables/`, `stores/`

#### Opening Store Workflow (`/shift`)

- 3-screen guided flow: Welcome Back → Open Cash Drawer → Ready for Business
- Time-based greeting: "Good Morning ☀" / "Good Afternoon 🌤" / "Good Evening 🌙"
- Cash drawer integration via `/api/v1/cash-drawers/open` and `/current` endpoints
- Shift state persistence via Pinia store + localStorage
- Live shift timer counting elapsed time

#### POS Checkout Experience (`/pos`)

- 4-zone layout: Search | Products | Cart | Actions
- Universal product search (name, SKU, barcode, brand, category) with instant client-side filtering
- Product grid with large touch targets, stock badges, and pinning for quick sale
- Cart with inline quantity +/-, item discount, notes, and delete
- Totals display with large, distance-readable numbers
- Slide-up PaymentDrawer with Cash/Card/M-Pesa/Bank/Split payment methods
- Cash payment with real-time change calculation
- M-Pesa payment with STK push simulation
- Receipt preview overlay with print/email/SMS options
- Cart recovery: restores unsaved cart on page refresh
- Keyboard shortcuts: F2 (search), F8 (suspend), F9 (payment), F10 (checkout), +/- (qty), Ctrl+Del (clear), Enter (checkout)

#### Theme System

- CSS variable-based theming with HSL color space
- Dark/light mode toggle persisted to localStorage
- Theme Settings page (`/theme-settings`) with live preview
- Business branding: organization name and theme color customization

#### Notification System

- Singleton notification service with success(), error(), warning(), info()
- Toast notifications with type-colored variants
- Axios interceptor for automatic API error handling
- vue-sonner integration with proper CSS import

#### Design System

- Tailwind CSS v4 with proper configuration
- Shared UI components: Button (with loading state), Input, Card, Dialog, Tooltip
- Business components: ProductCard, KPIStatCard, StatusBadge, MoneyDisplay
- `touch-target` utility class for minimum 44px tap targets
- `scrollbar-hide` utility for custom scrollbars

#### Authentication UI

- Login page with organization-aware authentication
- Protected routes via router guards
- Auth state persistence with role-based redirect

#### Data Layer

- @tanstack/vue-query for server state management
- Axios-based API client with auth interceptors
- Response format: `{ success, data, message, meta }`
- Query key standardization (e.g., `['products-list']`, `['dashboard']`)

### Improved

- Error handling across all user-facing actions
- Loading, error, and empty states for all data-fetching components
- Responsive navigation with mobile sidebar overlay
- Product grid with grid/list view toggle
- Category filter chips for product browsing
- Customer lookup with search and selection
- Cart item inline editing (discount, notes, quantity)
- Payment method selection with visual feedback

### Fixed

- Notification display (missing vue-sonner CSS import)
- axios `get()` double-wrapped request params — now accepts AxiosRequestConfig directly
- Cart emit types: `index: number` → `id: string` to match useCart's ID-based API
- SuspendSaleDialog default value: `never[]` type error fixed with factory function
- ReceiptPreview: `Print` → `Printer` icon, removed unused imports
- Router infinite redirect loop: added `rolesLoaded` flag to gate role-based redirects
- POS workspace: added shift guard requiring open cash drawer before selling

## [v1.0.0] — 2026-07-29

### Summary

Initial backend foundation release with Fastify + TypeScript + Prisma + PostgreSQL.

### Added

- Complete module architecture (auth, products, categories, sales, cash, reports)
- JWT-based authentication with refresh token flow
- Multi-tenancy via request context
- Prisma ORM with PostgreSQL
- API conventions: `{ success, data, message }` response format
