# ADR-001: Inventory is event-based

## Status
Accepted

## Context
Stock levels must be auditable. Every change to inventory must produce an immutable log entry that records what changed, when, and why.

## Decision
- `Stock` is a projection table (current quantity + reserved quantity).
- `StockMovement` is an immutable log of every stock change.
- `StockService` is the only entry point for stock mutations.
- Every mutation creates a `StockMovement` and an `AuditLog` entry within the same transaction.

## Consequences
- Full audit trail of all inventory changes.
- Stock levels can be recalculated from movement history at any point.
- No direct Prisma writes to `Stock` from outside `StockService`.
