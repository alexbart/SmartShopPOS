# 0002 — Unit of Work with Prisma Transactions

**Status:** Accepted  
**Date:** 2026-01-20

## Context

Business operations frequently span multiple repositories (e.g., creating a sale also decrements stock and creates stock movements). These must be atomic—either all succeed or all fail.

## Decision

Introduce an `IUnitOfWork` interface with an `execute<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>` method. The implementation wraps `prisma.$transaction()`. Repositories accept either `PrismaClient` or `Prisma.TransactionClient` via their constructor, enabling both standalone and transactional usage.

### Pattern:
```
return this._unitOfWork.execute(async (tx) => {
  const repo = new SomeRepositoryImpl(tx);
  // all DB operations use `tx`
});
```

### Service-level transactions:
Services like `SaleService` call `this._stockService.decrease()` inside their `unitOfWork.execute()` block. The stock service creates its own nested transaction via `unitOfWork.execute()`.

### Alternatives considered:
- **Database-level transactions only** — rejected; too low-level, hard to orchestrate complex flows.
- **Event sourcing** — rejected for v1.0; valuable but adds significant complexity.

## Consequences

All multi-repository mutations must go through `IUnitOfWork.execute()`. Nested transactions are supported by Prisma but should be used deliberately—they create savepoints.
