# SmartShopPOS Database Architecture

## Document Information

| Property     | Value                 |
| ------------ | --------------------- |
| Document     | Database Architecture |
| Product      | SmartShopPOS          |
| Version      | 1.0.0                 |
| Status       | Architecture Draft    |
| Owner        | Engineering Team      |
| Last Updated | July 2026             |

---

# 1. Purpose

This document defines the database architecture of SmartShopPOS.

It describes:

- Database technology decisions
- Data organization
- Collections/models
- Relationships
- Indexing
- Data isolation
- Synchronization requirements

---

# 2. Database Philosophy

SmartShopPOS data must be:

- Accurate
- Auditable
- Recoverable
- Scalable
- Tenant isolated
- Synchronization friendly

---

# 3. Database Strategy

## Primary Database

Version 1:

Postgres

---

Reasons:

- Flexible retail structures
- Fast development
- Offline synchronization support
- Document-based transactions
- Easy SaaS scaling

---

# 4. Repository Abstraction

The application must not directly depend on Postgres.

Architecture:

```
Service Layer

↓

Repository Interface

↓

Postgres Implementation
```

Future databases can be introduced without rewriting business logic.

---

# 5. Database Deployment Modes

## Local Database

Used by:

- Desktop POS
- Offline mode
- Small businesses

---

## Cloud Database

Used by:

- SaaS platform
- Central reporting
- Multi-branch operations

---

# 6. Multi-Tenant Data Model

SmartShopPOS uses:

Shared Database

Shared Application

Tenant Isolation

---

Every tenant-owned document contains:

```
organizationId
```

Example:

```
{
 id:"123",
 organizationId:"shop001",
 name:"Samsung TV"
}
```

---

# 7. Core Collections

SmartShopPOS contains:

```
organizations

users

roles

permissions

branches

devices

products

categories

inventory

stock_movements

customers

suppliers

sales

sale_items

payments

expenses

shifts

cash_drawers

receipts

tax_records

etims_transactions

sync_events

audit_logs

notifications
```

---

# 8. Organization Collection

Represents a business.

Example:

```
Organization

{
 id,

 name,

 businessType,

 kraPin,

 phone,

 email,

 address,

 subscriptionPlan,

 settings,

 createdAt,

 updatedAt
}
```

---

# 9. User Collection

Represents system users.

Example:

```
User

{
 id,

 organizationId,

 name,

 email,

 passwordHash,

 roleId,

 branchIds,

 status,

 lastLogin,

 createdAt
}
```

---

# 10. Role Collection

RBAC implementation.

Example:

```
Role

{
 id,

 organizationId,

 name,

 permissions:[]
}
```

---

# 11. Branch Collection

Supports multi-location businesses.

Example:

```
Branch

{
 id,

 organizationId,

 name,

 location,

 phone,

 active
}
```

---

# 12. Device Collection

Represents POS terminals.

Example:

```
Device

{
 id,

 organizationId,

 branchId,

 deviceName,

 deviceType,

 lastSync,

 status
}
```

---

# 13. Product Collection

Core retail entity.

Example:

```
Product

{
 id,

 organizationId,

 categoryId,

 name,

 sku,

 barcode,

 sellingPrice,

 buyingPrice,

 taxRate,

 unit,

 images,

 attributes,

 active,

 createdAt
}
```

---

# 14. Category Collection

Organizes products.

Example:

```
Category

{
 id,

 organizationId,

 name,

 parentId
}
```

Supports:

Electronics

Phones

Accessories

---

# 15. Inventory Collection

Tracks current stock.

Example:

```
Inventory

{
 id,

 organizationId,

 branchId,

 productId,

 quantity,

 reorderLevel,

 updatedAt
}
```

---

# 16. Stock Movement Collection

Immutable stock history.

Example:

```
StockMovement

{
 id,

 organizationId,

 productId,

 type,

 quantity,

 reference,

 createdBy,

 createdAt
}
```

Types:

PURCHASE

SALE

RETURN

ADJUSTMENT

TRANSFER

---

# 17. Customer Collection

Example:

```
Customer

{
 id,

 organizationId,

 name,

 phone,

 email,

 address,

 loyaltyPoints,

 creditLimit
}
```

---

# 18. Supplier Collection

Example:

```
Supplier

{
 id,

 organizationId,

 name,

 phone,

 email,

 paymentTerms
}
```

---

# 19. Sale Collection

Critical financial document.

Example:

```
Sale

{
 id,

 organizationId,

 branchId,

 cashierId,

 customerId,

 items,

 subtotal,

 tax,

 discount,

 total,

 status,

 createdAt
}
```

---

# 20. Sale Item Structure

Embedded inside sale.

Example:

```
items:[

{

productId,

name,

quantity,

price,

tax,

subtotal

}

]
```

---

Reason:

Historical accuracy.

If product price changes tomorrow,

old receipts remain unchanged.

---

# 21. Payment Collection

Example:

```
Payment

{
 id,

 saleId,

 method,

 amount,

 reference,

 status,

 provider,

 createdAt
}
```

Methods:

CASH

MPESA

CARD

BANK

PAYSTACK

---

# 22. Shift Collection

Cashier session tracking.

Example:

```
Shift

{
 id,

 cashierId,

 branchId,

 openingBalance,

 closingBalance,

 status,

 openedAt,

 closedAt
}
```

---

# 23. Receipt Collection

Stores issued receipts.

Example:

```
Receipt

{
 id,

 saleId,

 receiptNumber,

 printedAt,

 copies
}
```

---

# 24. eTIMS Collection

Stores KRA submissions.

Example:

```
ETimsTransaction

{
 id,

 saleId,

 invoiceNumber,

 submissionStatus,

 kraResponse,

 submittedAt
}
```

---

# 25. Sync Event Collection

Offline synchronization.

Example:

```
SyncEvent

{
 id,

 deviceId,

 organizationId,

 entity,

 action,

 payload,

 version,

 status,

 createdAt
}
```

---

# 26. Audit Log Collection

Immutable business history.

Example:

```
AuditLog

{
 id,

 organizationId,

 userId,

 action,

 entity,

 oldValue,

 newValue,

 timestamp
}
```

---

# 27. Database Indexing Strategy

Required indexes:

## Organization

organizationId

---

## Product

organizationId + barcode

organizationId + sku

organizationId + name

---

## Sales

organizationId + createdAt

branchId + createdAt

---

## Inventory

organizationId + productId

branchId + productId

---

## Sync

deviceId + status

---

# 28. Data Retention

Financial data:

Permanent

Audit logs:

Minimum legal retention period

Temporary sync data:

Configurable cleanup

---

# 29. Backup Strategy

Local:

Daily backup

Cloud:

Automated backups

---

Backup includes:

Database

Configuration

Documents

Images

---

# 30. Future Analytics Database

Future architecture:

Operational Database

↓

Data Pipeline

↓

Analytics Database

↓

AI Models

---

# 31. Final Database Decision

SmartShopPOS Version 1:

Postgres

-

Repository Pattern

-

Event-Based Synchronization

-

Tenant Isolation

-

Audit Trail
