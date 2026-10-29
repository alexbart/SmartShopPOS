# ADR-003: Stock mutations only through StockService

## Status
Accepted

## Context
Multiple domains (Sales, Purchasing, Returns, Adjustments) need to modify stock levels. Each has different business rules and audit requirements.

## Decision
- `StockService` is the single gateway for all stock mutations.
- Methods: `increase()`, `decrease()`, `adjust()`, `transfer()`.
- All mutations run inside a transaction via `IUnitOfWork`.
- Every mutation creates a `StockMovement` and an `AuditLog` entry.
- Sales module calls `StockService.decrease()` — it never writes to `Stock` directly.

## Consequences
- Inventory rules are centralized in one place.
- Adding new movement types or audit requirements only requires changes to `StockService`.
- Sales, Purchasing, and other modules remain decoupled from inventory implementation details.
