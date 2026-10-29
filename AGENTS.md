# AGENTS.md

## Commands

- `npm run dev` (from `apps/api`) — Start backend dev server (tsx watch, port 4000)
- `npm run dev` (from `apps/web`) — Start frontend dev server (Vite, port 5173)
- `npm run build` (from `apps/api`) — Build backend (tsc)
- `npm run build` (from `apps/web`) — Build frontend (vite build)
- `npm run test` (from `apps/api`) — Run backend tests
- `npm run test` (from `apps/web`) — Run frontend tests (vitest)
- `npx prisma migrate dev --name <name>` (from `apps/api`) — Create migration

## Project Structure

```
apps/
  api/                    # Backend (Fastify + TypeScript + Prisma)
    src/
      modules/            # Domain modules (auth, products, pos, etc.)
      shared/             # Shared utilities
      plugins/            # Fastify plugins
  web/                    # Frontend (Vue 3 + TypeScript + Vite)
    src/
      components/
        ui/               # Reusable UI components (Button, Input, Select...)
        business/         # Business-specific components (MoneyDisplay, StatusBadge...)
      stores/             # Pinia stores (auth, theme, notification)
      modules/            # Feature modules (auth, catalog, pos, finance...)
      layouts/            # App layouts
      shared/             # Shared types, API client
```

## Key Patterns

### Notification Service

Use `notification.success()`, `notification.error()`, `notification.warning()`, `notification.info()` everywhere. Backend errors are auto-handled by the axios interceptor.

### Theme System

Theme is managed by `useThemeStore()`. CSS variables are used throughout (`hsl(var(--color-*)`). On the frontend, `theme.loadTheme()` is called on app mount. Theme settings page is at `/theme-settings`.

### Data Fetching

Use `@tanstack/vue-query` for data fetching. API client wraps axios with auth interceptors.

### Styling

Custom CSS in `src/assets/tailwind.css`. CSS variables in `:root`. Theme variables updated via `document.documentElement.style.setProperty()`.
