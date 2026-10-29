# 0005 — Cache Abstraction with Graceful Degradation

**Status:** Accepted  
**Date:** 2026-07-28

## Context

Dashboard and reporting endpoints have expensive aggregations. Caching is needed for performance, but Redis may not always be available (development, small deployments, degraded environments).

## Decision

Introduce a `CacheService` interface with `get()`, `set()`, `del()`, and `invalidatePattern()` methods. Two implementations:

- **RedisCacheService** — uses `@upstash/redis` when `REDIS_ENABLED=true`
- **NoOpCacheService** — in-memory zero-overhead fallback, used by default

A `CacheFactory` auto-detects Redis availability from environment config and logs a warning when falling back. Cache invalidation events are published via the existing event system (SaleCreatedEvent, SaleVoidedEvent, StockLevelChangedEvent).

### Alternatives considered:
- **Always require Redis** — rejected; blocks local development and small deployments.
- **Redis-only with try/catch** — rejected; scattered error handling is error-prone.

## Consequences

All caching is transparent. Setting `REDIS_ENABLED=false` (default) disables caching without code changes. Cache keys include organizationId prefix to prevent cross-tenant leakage.
