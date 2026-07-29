# SmartShopPOS Database Implementation Guide

## Document Information

| Property     | Value                         |
| ------------ | ----------------------------- |
| Document     | Database Implementation Guide |
| Product      | SmartShopPOS                  |
| Version      | 1.0.0                         |
| Status       | Development Blueprint         |
| Owner        | Engineering Team              |
| Last Updated | July 2026                     |

---

# 1. Purpose

This document defines the implementation standards for the SmartShopPOS database.

It covers:

- PostgreSQL setup
- Prisma configuration
- Schema standards
- Migration workflow
- Data integrity rules
- Multi-tenancy strategy
- Indexing strategy
- Backup strategy

---

# 2. Database Technology

Primary Database:

PostgreSQL

ORM:

Prisma ORM

Cache:

Redis

Local Offline Database:

SQLite

---

# 3. Database Architecture

                SmartShopPOS

                     |

                Fastify API

                     |

                 Prisma ORM

                     |

                PostgreSQL

                     |

      -----------------------------

      |                           |

Redis Cache Object Storage

---

# 4. Prisma Project Structure

apps/api/

prisma/

├── schema.prisma

├── migrations/

├── seed.ts

└── scripts/

src/

database/

├── prisma.ts

├── repositories/

├── transactions/

└── seed/

---

# 5. Prisma Client Setup

Single Prisma instance.

Example:

database/prisma.ts

Purpose:

- Prevent multiple database connections
- Improve performance
- Simplify testing

---

# 6. Naming Conventions

Database:

snake_case

Example:

organization_id

created_at

updated_at

---

Prisma Models:

PascalCase

Example:

Organization

Sale

Product

---

Fields:

camelCase

Example:

organizationId

createdAt

---

# 7. Primary Key Strategy

All major entities use UUID.

Example:

id UUID PRIMARY KEY

Reason:

Supports:

- Distributed systems
- Offline creation
- Synchronization
- SaaS scaling

---

# 8. Standard Audit Fields

Most tables contain:

id

createdAt

updatedAt

createdBy

updatedBy

---

Example:

Product

{

id,

name,

price,

createdAt,

updatedAt

}

---

# 9. Multi-Tenant Database Strategy

SmartShopPOS is SaaS.

Every business belongs to:

Organization

---

Core tenant tables contain:

organizationId

Example:

Product

Sale

Customer

Inventory

Supplier

---

# 10. Tenant Isolation Rule

Every query must filter:

organizationId

Example:

Correct:

Find products where:

organizationId = currentOrganization

Incorrect:

Find all products

---

# 11. Core Entity Groups

## Identity

Organization

User

Role

Permission

Session

---

## Business Structure

Branch

Terminal

Settings

---

## Catalog

Product

Category

Brand

Unit

Barcode

---

## Inventory

Stock

StockMovement

Warehouse

Adjustment

Transfer

---

## Sales

Sale

SaleItem

Receipt

Refund

Discount

---

## Payments

Payment

PaymentMethod

Transaction

---

## Compliance

Invoice

TaxRecord

ETIMSSubmission

---

## Audit

AuditLog

ActivityLog

---

# 12. Relationship Rules

Use foreign keys.

Example:

Organization

|

many

|

Products

---

Never store relationships as plain text.

Bad:

product.organization = "Shop ABC"

Good:

organizationId

---

# 13. Transaction Rules

Critical operations use database transactions.

Examples:

Sale creation:

BEGIN TRANSACTION

Create Sale

Create Sale Items

Reduce Inventory

Create Payment

Create Audit Log

COMMIT

---

If anything fails:

ROLLBACK

---

# 14. Inventory Design Rule

Never directly modify stock quantity.

Avoid:

stock = stock - 1

---

Use:

Stock Movement

Example:

SALE

-1 ITEM

PURCHASE

+50 ITEMS

ADJUSTMENT

-2 ITEMS

---

Current stock is calculated from movements.

---

# 15. Soft Delete Strategy

Business records should not be permanently deleted.

Use:

deletedAt

Example:

Product

deletedAt

---

Reason:

Maintain:

- Reports
- Audit history
- Compliance records

---

# 16. Index Strategy

Important indexes:

organizationId

createdAt

barcode

sku

phoneNumber

transactionReference

---

Example:

Product search:

barcode lookup

must be fast

---

# 17. Unique Constraints

Examples:

Product SKU:

organizationId + sku

---

Receipt number:

organizationId + receiptNumber

---

Payment reference:

provider + transactionId

---

# 18. Migration Rules

Development:

prisma migrate dev

---

Production:

prisma migrate deploy

---

Never:

Manually modify production database.

---

# 19. Seed Data

Seed environment contains:

Demo organization

Example users

Sample products

Sample transactions

---

Purpose:

- Development
- Testing
- Demonstrations

---

# 20. Testing Database

Tests use:

Separate PostgreSQL database.

Never:

Use production data.

---

# 21. Backup Strategy

Production:

Daily backups.

Retention:

Based on subscription plan.

---

Backup includes:

Database

Configuration

Important documents

---

# 22. Database Security

Requirements:

- Strong passwords
- Restricted access
- Encrypted connections
- Separate users

---

# 23. Prisma Rules

Developers must:

Use migrations.

Review generated SQL.

Avoid unsafe raw queries.

Use transactions for financial operations.

---

# 24. Future Scaling

Possible improvements:

- Read replicas
- Partitioning
- Database sharding
- PostgreSQL Row Level Security

---

# 25. Final Decision

SmartShopPOS uses PostgreSQL with Prisma ORM, UUID identifiers, tenant isolation, transaction-based operations, and migration-controlled database evolution.
