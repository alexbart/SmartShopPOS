# 0007 — Stock Mutation Invariant

**Status:** Accepted  
**Date:** 2026-07-29

## Context

Stock levels are modified from multiple domains: sales, purchasing (goods receipt), inventory adjustments, and transfers. Each mutation must create a stock movement record, update audit logs, and enforce validation rules (no negative stock, reserved quantity tracking).

## Decision

`StockService` is the **single point of responsibility** for all inventory mutations. No module directly calls `StockRepositoryImpl` for mutations.

### Methods:
- `increase()` — increases available stock (used by goods receipt, returns)
- `decrease()` — decreases available stock (used by sales)
- `adjust()` — arbitrary adjustment (used by physical counts, corrections)
- `reserve()` / `release()` — manage reserved quantities

Each method:
1. Finds or creates the `Stock` record
2. Validates the resulting quantity
3. Creates a `StockMovement` record
4. Creates an `AuditLog` entry
5. All within a single transaction

### Violation example (caught in code review):
PurchaseOrderService initially called `StockRepositoryImpl` directly for goods receipt. This was refactored to use `StockService.increase()` to maintain the invariant.

### Alternatives considered:
- **Per-module stock logic** — rejected; leads to inconsistency and duplicated validation.
- **Domain events for stock changes** — considered for v2.0; would enable loose coupling but adds complexity.

## Consequences

All stock mutations flow through `StockService`. New domains that affect stock (transfers, adjustments) must use this service. Tests verify no direct repository mutation calls exist outside StockService via integration tests.
