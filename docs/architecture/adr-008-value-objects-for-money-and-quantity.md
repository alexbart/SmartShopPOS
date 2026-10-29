# ADR-008: Value objects for Money and Quantity

## Status
Proposed

## Context
Financial and inventory calculations currently use raw `number` and `Decimal` types, which are prone to floating-point errors and make business rules implicit.

## Decision
- `Money` value object wraps decimal amounts with methods: `add()`, `subtract()`, `multiply()`, `percentage()`, `round()`.
- `Quantity` value object wraps inventory quantities with methods: `add()`, `subtract()`, `greaterThan()`, `isNegative()`, `isZero()`.
- Both are immutable — operations return new instances.

## Consequences
- Prevents floating-point rounding bugs in financial calculations.
- Makes inventory rules explicit and self-documenting.
- Can be adopted gradually — existing code continues to work with raw numbers.
