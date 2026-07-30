# Architecture Decisions

## Document Information

| Property     | Value                  |
| ------------ | ---------------------- |
| Document     | Architecture Decisions |
| Product      | SmartShopPOS           |
| Version      | 1.0.0                  |
| Status       | Approved               |
| Owner        | Core Engineering Team  |
| Last Updated | July 2026              |

---

# Purpose

This document records the foundational architecture decisions for SmartShopPOS.

These decisions define the non-negotiable technical direction of the platform and prevent future contributors from unintentionally undoing foundational architecture.

---

# ADR-001 — PostgreSQL 16

## Decision

Use PostgreSQL 16 as the primary datastore.

## Rationale

- Strong ACID guarantees required for financial data
- Excellent JSON support for flexible attributes
- Proven performance for transactional POS workloads
- Rich extension ecosystem for future needs
- Strong tooling and operational maturity
- Native UUID support for key strategy

## Consequences

- All data models must respect relational integrity
- Migrations must be backward compatible
- Schema changes require review

---

# ADR-002 — Prisma as ORM

## Decision

Use Prisma as the database access layer.

## Rationale

- Type-safe database access
- Excellent TypeScript integration
- Built-in migration tooling
- Reduces boilerplate for common operations
- Supports soft deletes, UUIDs, and indexes natively
- Team familiarity and fast onboarding

## Consequences

- All database access flows through Prisma Client
- Services must not embed raw SQL without review
- Prisma schema is the source of truth for data model

---

# ADR-003 — UUID v7 for Primary Keys

## Decision

Use UUID v7 for all primary keys.

## Rationale

- Time-ordered for better index performance
- Distributed-system friendly
- Safer for SaaS multi-tenant architectures
- Better synchronization than UUID v4
- Supported natively by PostgreSQL and Prisma
- Harder to guess than sequential integers

## Consequences

- No integer primary keys anywhere in the system
- All ID columns use `db.Uuid` with `@default(uuid())`
- External integrations receive UUIDs, not integers

---

# ADR-004 — Repository Pattern

## Decision

All database access must go through repositories.

## Rationale

- Services never call Prisma directly
- Easier testing with mock repositories
- Enables future caching layers transparently
- Allows future datastore changes without touching business logic
- Keeps controllers thin

## Consequences

- Every module exposes a repository interface
- Controllers call services, services call repositories
- Direct Prisma usage outside repositories is prohibited

---

# ADR-005 — Domain Events

## Decision

Important business actions emit domain events via an in-process event bus from day one.

## Rationale

- Decouples related operations
- Prepares for future async processing
- Enables audit logging, analytics, and notifications cleanly
- Can migrate to Redis, RabbitMQ, or Kafka without changing business logic

## Consequences

- Every module defines its events
- Startup registers event handlers
- Handlers may be synchronous in v1

---

# ADR-006 — Soft Deletes

## Decision

Business data uses soft deletes instead of permanent deletion.

## Rationale

- Required for KRA compliance
- Supports audit and historical reporting
- Enables data recovery
- Prevents accidental data loss

## Consequences

- All auditable tables include `deletedAt` and `deletedBy`
- Repositories filter out deleted records by default
- Permanent deletion requires explicit admin action and audit trail

---

# ADR-007 — RBAC with Fine-Grained Permissions

## Decision

Authorization uses RBAC with fine-grained permissions.

## Rationale

- Roles group permissions
- Permissions follow `resource.action` format
- Supports enterprise customization
- Aligns with documented permissions matrix

## Consequences

- Every protected operation checks permissions
- Roles are configurable per organization
- New actions require new permission entries

---

# ADR-008 — Standardized Paginated API Contract

## Decision

All collection endpoints return a standardized paginated response.

## Rationale

- Consistent client behavior
- Predictable contract across frontend, mobile, and integrations
- Supports pagination, filtering, search, sorting, field selection, and includes

## Response Shape

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 132,
    "totalPages": 6
  },
  "meta": {
    "requestId": "...",
    "timestamp": "...",
    "version": "v1"
  }
}
```

## Consequences

- All list endpoints implement the same contract
- Query parameter parsing is standardized
- SDKs can rely on a single response shape

---

# ADR-009 — Modular Monolith with Clear Boundaries

## Decision

SmartShopPOS is a modular monolith in v1.

## Rationale

- Faster development than microservices
- Clear module boundaries prepare for future service extraction
- Single deployment reduces operational complexity
- Shared database supports migrations and transactions

## Consequences

- Modules must not bypass other modules
- Circular dependencies are prohibited
- Each module follows the standard folder structure
- Future module extraction should require minimal changes

---

# ADR-010 — Audit Logging by Default

## Decision

Every mutating operation produces an immutable audit record.

## Rationale

- Required for compliance and dispute resolution
- Supports security investigation
- Provides operational transparency

## Audit Record Must Contain

- Who performed the action
- When it occurred
- Where (branch or device)
- Which API or command
- Organization and request identifiers
- IP address when available

## Consequences

- Audit middleware or decorator captures writes
- Audit logs are immutable from application code
- Sensitive operations always produce audit records

---

# ADR-011 — Standard Query Contract

## Decision

All collection endpoints accept a standard set of query parameters.

## Rationale

- Uniform behavior across the API
- Reduces client-side conditional logic
- Enables shared query parsing utilities

## Supported Parameters

- `page` — current page number
- `pageSize` — items per page
- `search` — free-text search query
- `sort` — sort field
- `order` — sort direction, `asc` or `desc`
- `status` — status filter where applicable
- `categoryId` — category filter where applicable
- `branchId` — branch filter where applicable
- `include` — related resources to embed
- `fields` — response field selection

## Consequences

- List handlers parse and apply these parameters
- Repositories accept filter objects
- Invalid values return validation errors

---

# Locked Baseline

Before Sprint 1, SmartShopPOS commits to:

- PostgreSQL 16
- Prisma
- UUID v7 for primary keys
- Repository pattern
- Domain events via in-process bus
- Soft deletes for business entities
- RBAC with fine-grained permissions
- Standard paginated API contract
- Standard query contract
- Audit logging by default
- Modular monolith boundaries

These decisions are locked unless a formal ADR proposes change.
