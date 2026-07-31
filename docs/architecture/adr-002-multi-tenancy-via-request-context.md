# ADR-002: Multi-tenancy enforced via RequestContext

## Status
Accepted

## Context
SmartShopPOS is a multi-tenant SaaS platform. Every request must be scoped to the organization of the authenticated user.

## Decision
- `RequestContext` is attached to every Fastify request via the `createAuthenticateHook` middleware.
- It contains `userId`, `organizationId`, `branchId`, `roles`, `permissions`, and `requestId`.
- All repository queries filter by `organizationId`.
- No service accepts `organizationId` from the client — it is always derived from `RequestContext`.

## Consequences
- Data isolation is enforced at the query level.
- Cross-tenant data access is impossible without bypassing the middleware.
- Branch-level scoping is available via `branchId`.
