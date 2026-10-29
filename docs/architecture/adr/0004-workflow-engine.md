# 0004 — Workflow & Approval Engine

**Status:** Accepted  
**Date:** 2026-07-30

## Context

Multiple business domains (purchasing, expense management, sales voids, price changes) need approval workflows with configurable rules. Hardcoding approval logic in each module would create duplication and make policy changes difficult.

## Decision

Introduce a shared `WorkflowService` with a single `requestApproval()` API. Business modules call this service and react to the outcome—never implementing approval logic themselves.

### Architecture:
- **ApprovalRule** — configurable: action, min/max amount, approverRole, branchId (optional), priority, isActive
- **ApprovalRequest** — tracks entityType, entityId, amount, status (PENDING/APPROVED/REJECTED/EXPIRED/CANCELLED)
- **Rule matching** — branch-specific rules first, then global rules, auto-approve if no match
- **Duplicate prevention** — blocks multiple PENDING requests for the same entity

### Module integration pattern:
```
// PurchaseOrderService.submit()
const approval = await this._workflowService.requestApproval({...});
const newStatus = approval.status === 'PENDING' 
  ? 'PENDING_APPROVAL' 
  : PurchaseOrderStatuses.SUBMITTED;
```

The `WorkflowAction` enum provides a single source of truth shared across ApprovalRule, ApprovalRequest, AuditLog, and future notification systems.

### Alternatives considered:
- **Hardcoded thresholds per module** — rejected; not configurable, requires code changes for policy updates.
- **External BPM engine** — rejected; too heavyweight for current needs.

## Consequences

New domains that need approval simply call `workflowService.requestApproval()`. Approval rules are managed via a future admin UI or seed data. The engine is event-ready for future notifications (email, SMS, push).
