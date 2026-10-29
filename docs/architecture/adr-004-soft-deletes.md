# ADR-004: Soft deletes across business entities

## Status
Accepted

## Context
Business entities (Customer, Product, Category, Brand, Unit, Tax, Supplier, Warehouse) must be deletable without losing historical data. Sales, payments, and audit logs reference these entities.

## Decision
- All business entities use soft deletes with a `deletedAt` nullable timestamp column.
- `deletedAt IS NULL` is included in all `findFirst`/`findMany` queries.
- `softDelete()` sets `deletedAt` to `NOW()` and `isActive` to `false`.
- Hard deletes are never performed on business entities.

## Consequences
- Historical data integrity is preserved.
- Reports can include or exclude deleted entities.
- Storage grows over time but can be archived.
