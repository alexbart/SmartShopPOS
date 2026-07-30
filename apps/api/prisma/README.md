# Prisma

Prisma ORM configuration for SmartShopPOS.

## Setup

```bash
# Configure environment variables
cp .env.example .env

# Run migrations
pnpm exec prisma migrate dev --name initial

# Seed database
pnpm exec prisma db seed

# Open Prisma Studio
pnpm exec prisma studio
```

## Structure

- `schema.prisma` — Database schema
- `migrations/` — Migration history
- `seeds/` — Seed scripts

## Conventions

- All primary keys use UUID
- All tables include soft delete and audit fields
- Foreign keys use `onDelete: Cascade`
- Indexes are defined explicitly for multi-tenant queries
