# Changelog

All notable changes to SmartShopPOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Inventory Workspace (`/inventory`)

- **Tabbed workspace** with 7 tabs: Overview, Products, Stock Levels, Movements, Transfers, Adjustments, Cycle Counts
- **Overview cards**: Total Products, Low Stock, Out of Stock, Inventory Value, Today's Movements, Reserved
- **Recent Activity feed** showing today's stock movements
- **InventoryProductTable** with status badges (In Stock / Low / Out / Incoming), sorting, selection, and stock columns
- **StockMovementTimeline** with grouped timeline view (Today → Yesterday → etc.), type/date filters, and animated movement entries
- **GoodsReceivingWizard** — 4-step flow (Warehouse → Add Products → Review Quantities → Confirm) with batch receiving
- **TransferStockDialog** — Visual warehouse-to-warehouse transfer with source/destination selection, product picker, and quantity
- **AdjustmentDialog** — Stock adjustment with forced reason selection (Damage, Expired, Theft, Count, Other), type selection, and notes
- **CycleCountView** — Expected vs. Counted comparison with difference highlighting and reason capture
- **BulkActionBar** — Export CSV, Print Labels, Archive, Delete with selection awareness
- **InventoryFilters** — Warehouse dropdown with "Receive Goods" quick action button

#### Feature Flag System

- Backend: `featureFlagsPlugin` Fastify plugin with environment-variable-driven configuration (FEATURE_POS, FEATURE_INVENTORY, etc.)
- Backend: `/api/v1/feature-flags` API endpoint
- Frontend: `useFeatureFlagsStore` Pinia store with auto-loading and API-backed flags

#### Demo Data Seed

- 1,000 products across 6 categories (Beverages, Bakery, General, Electronics, Household, Stationery)
- 100 customers with Kenyan names and realistic phone numbers
- 50 suppliers with contact persons, tax pins, and payment terms
- 9 employees (7 cashiers, 2 managers) with hashed passwords
- 500 historical sales with stock movements, payments, and receipts
- Cash drawer session with $25,500 starting float and sales total

### Changed

- Route path `/warehouses` → `/inventory` for the inventory workspace
- Layout navigation updated to point to `/inventory`

### Added (Backend)

- `listMovements` endpoint on InventoryController (`/inventory/movements`)
- `listMovements` method on StockService

#### Finance Workspace (`/finance`)

- **Finance Dashboard** — 5-summary card row (Today Revenue, Today Expenses, Cash Drawer, Bank Balance, Profit Today) with trend indicators, quick action bar, cash drawer status card, and recent expenses preview
- **Cash Drawer Workspace** — Shift management workflow with open/close drawer, cash in/out operations, detailed movements timeline, and full reconciliation summary (Opening Float, Cash Sales, Refunds, Expenses Paid, Cash In/Out, Expected vs Counted, Variance with warning display)
- **Expenses Workspace** — Card-based expense listing with status badges (Approved/Pending/Rejected), filtering by status and category, category expense totals, new expense form with drag-and-drop receipt upload and preview
- **Banking Workspace** — Bank account management, deposit workflow (Cash → Deposit → Bank Account → Confirmed) with visual timeline, recent deposits list, and new deposit form
- **End of Day Closing Wizard** — 4-step guided reconciliation (Count Cash → Compare → Variance → Submit) with manager review flag on variance
- **Finance Composable** — `useFinance.ts` with `useCashDrawer`, `useExpenses`, `useExpenseCategories`, `useBanking`, and `useFinanceDashboard` composables
- Command Palette entries for Finance Dashboard, Expenses, Banking, and End of Day Closing

## [v1.1.0-ui-foundation] — 2026-08-01

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
