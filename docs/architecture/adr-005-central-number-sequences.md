# ADR-005: Number sequences generated centrally

## Status
Accepted

## Context
Business documents (invoices, receipts, purchase orders, goods receipts) require human-readable, sequential numbers unique per organization.

## Decision
- `NumberSequenceService` is the single source of truth for all business document numbers.
- Uses a `NumberSequence` table with atomic `upsert` + `increment`.
- Format: `{PREFIX}-{YYMMDD}-{000001}` (e.g., `INV-260731-000001`).
- Entity types: SALE, PURCHASE, TRANSFER, RETURN, ADJUSTMENT, RECEIPT, PURCHASE_ORDER, GOODS_RECEIPT.

## Consequences
- Numbering is consistent across all domains.
- No duplicate numbers possible within an organization.
- Adding new document types only requires adding a prefix mapping.
