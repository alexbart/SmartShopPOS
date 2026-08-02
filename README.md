# SmartShopPOS

## Smart and Simple POS for everyone

A scalable SaaS-ready Point of Sale platform designed for Kenyan businesses.

## Technology Stack

Backend:

- Fastify
- TypeScript
- Prisma
- PostgreSQL

Frontend:

- Vue 3
- TypeScript
- Vite
- Tailwind CSS v4
- @tanstack/vue-query
- Pinia
- vue-sonner (toasts)

Infrastructure:

- Docker
- Redis
- Nginx

Features:

- Inventory management
- POS sales
- M-Pesa integration
- Paystack integration
- KRA eTIMS support
- Offline-first POS
- AI-powered business insights

## Project Status

| Area                     | Progress |
| ------------------------ | -------- |
| Backend                  | 100%     |
| Frontend Foundation      | 75%      |
| Catalog Workspace        | 35%      |
| Sales/Checkout Workspace | 40%      |
| Inventory Workspace      | 0%       |
| Reports UI               | 0%       |

## Documentation

Key documentation is in [docs/](docs/):

- [Release v1.0.0 Foundation](docs/releases/ui-v1.0.0-foundation.md)
- [Engineering Playbook](docs/03-engineering/ENGINEERING_PLAYBOOK.md)
- [Architecture Decisions](docs/03-architecture/ARCHITECTURE_DECISIONS.md)
- [API Design Guide](docs/03-engineering/API_DEVELOPMENT_GUIDE.md)
- [Git Workflow](docs/03-engineering/GIT_WORKFLOW.md)

## Development

```bash
# Start backend
cd apps/api && npm run dev

# Start frontend
cd apps/web && npm run dev

# Run type check
cd apps/web && npx vue-tsc --noEmit

# Run backend tests
cd apps/api && npx vitest run

# Build frontend
cd apps/web && npx vite build
```

## License

Proprietary — All rights reserved.
