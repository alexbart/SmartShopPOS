# 0001 — Multi-Tenant PostgreSQL with Prisma

**Status:** Accepted  
**Date:** 2026-01-15

## Context

The system requires multi-tenant SaaS with row-level data isolation. Tenants must be completely isolated—no cross-tenant data leaks acceptable.

## Decision

Use PostgreSQL as the primary relational database with Prisma ORM. Multi-tenancy is implemented via an `organizationId` column on every tenant-scoped table, enforced at the application layer.

### Alternatives considered:
- **Separate databases per tenant** — rejected for operational complexity and cost at scale.
- **PostgreSQL schemas per tenant** — rejected for similar operational reasons; would complicate migrations.
- **MySQL** — rejected; the team had stronger PostgreSQL expertise.

### Trade-offs:
- **Pros:** Single pool of connections, simplified migrations, easy horizontal scaling, full ACID compliance.
- **Cons:** Row-level isolation depends on application correctness; a bug in query scoping could leak data.

## Consequences

Every repository method must accept `organizationId` and include it in `where` clauses. This is enforced via code review and integration tests (organization isolation test cases).
