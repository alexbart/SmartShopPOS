# SmartShopPOS Business Rules Specification

## Document Information

| Property          | Value                                   |
| ----------------- | --------------------------------------- |
| Document          | Business Rules Specification            |
| Product           | SmartShopPOS                            |
| Version           | 0.1.0                                   |
| Status            | Draft                                   |
| Owner             | SmartShopPOS Product Team               |
| Related Documents | MASTER_PLAN.md, PRODUCT_REQUIREMENTS.md |
| Last Updated      | July 2026                               |

---

# 1. Introduction

## Purpose

This document defines the business rules governing SmartShopPOS.

Business rules describe how the system must behave regardless of implementation technology.

These rules act as the source of truth for:

- Developers
- QA Engineers
- Product Owners
- AI Development Agents
- Business Stakeholders

---

# 2. Business Rule Format

Every rule follows this structure:

## Rule ID

Unique identifier.

Example:

BR-SAL-001

---

## Title

Short description.

---

## Description

The business requirement.

---

## Reason

Why this rule exists.

---

## Scope

The affected business area.

---

## Enforcement

Where the rule must be enforced:

- Frontend
- Backend
- Database
- External Integration

---

## Related Artifacts

Links to:

- Database entities
- API endpoints
- UI screens
- Tests
- ADRs

---

# 3. Global Business Rules

---

## BR-GEN-001

### System Must Support Multiple Organizations

### Rule

SmartShopPOS shall support multiple independent businesses using the same platform.

Each organization must have isolated:

- Users
- Products
- Sales
- Customers
- Reports
- Settings

### Reason

SmartShopPOS is designed as a SaaS platform.

### Enforcement

Backend

Database

Authorization Layer

### Priority

Critical

---

## BR-GEN-002

### Data Isolation Between Organizations

### Rule

A user belonging to one organization must never access another organization's data.

### Reason

Protect customer privacy and maintain SaaS security.

### Enforcement

Backend authorization.

Database query filtering.

Automated tests.

### Priority

Critical

---

## BR-GEN-003

### Every Transaction Requires Ownership

### Rule

All business transactions must belong to:

- Organization
- Branch
- User

Examples:

Sales

Purchases

Payments

Inventory Adjustments

### Reason

Ensures accountability and reporting accuracy.

---

# 4. Organization Rules

---

## BR-ORG-001

### Organization Requires Basic Information

### Rule

An organization must have:

- Business name
- Contact information
- Country
- Currency
- Timezone

before activation.

### Reason

Required for receipts, reports, and compliance.

---

## BR-ORG-002

### Organization Has Default Settings

### Rule

Every new organization shall receive default configuration.

Examples:

- Currency
- Tax settings
- Receipt format
- Numbering sequence

---

# 5. User Rules

---

## BR-USR-001

### Every User Belongs To An Organization

### Rule

A user cannot exist without an organization.

---

## BR-USR-002

### Users Require Roles

### Rule

Every user must have at least one assigned role.

Examples:

- Owner
- Manager
- Cashier
- Accountant

---

# 6. Authentication Rules

---

## BR-AUTH-001

### Password Security

### Rule

Passwords must never be stored in plain text.

Passwords must be securely hashed.

---

## BR-AUTH-002

### Failed Login Protection

### Rule

Repeated failed login attempts must trigger protection mechanisms.

Examples:

- Rate limiting
- Temporary lockout

---

# 7. Product Rules

---

## BR-PRD-001

### Product Requires Name

### Rule

Every product must have a name.

### Reason

Products cannot be identified without names.

### Enforcement

Frontend

Backend

Database validation

---

## BR-PRD-002

### Product SKU Uniqueness

### Rule

Product SKU must be unique within an organization.

### Example

Allowed:

Organization A

SKU-001

Organization B

SKU-001

Not Allowed:

Organization A

SKU-001

Organization A

SKU-001

---

## BR-PRD-003

### Product Requires Selling Price

### Rule

A sellable product must have a selling price.

---

# 8. Inventory Rules

---

## BR-INV-001

### Inventory Changes Must Be Traceable

### Rule

Every stock movement must create an inventory record.

Examples:

- Sale
- Purchase
- Adjustment
- Return

---

## BR-INV-002

### Negative Inventory Policy

### Rule

Products cannot have negative inventory unless the organization enables negative stock.

Default:

Disabled

---

# 9. Sales Rules

---

## BR-SAL-001

### Sale Requires Items

### Rule

A sale cannot be completed without at least one product item.

---

## BR-SAL-002

### Completed Sales Cannot Be Edited

### Rule

A completed sale cannot be directly modified.

Corrections must use:

- Return
- Refund
- Adjustment

---

## BR-SAL-003

### Every Sale Requires Payment Status

A sale must have one of:

- Pending
- Partially Paid
- Paid
- Cancelled

---

# 10. Payment Rules

---

## BR-PAY-001

### Payment Must Reference Sale

### Rule

A payment cannot exist without a related transaction.

---

## BR-PAY-002

### Supported Payment Methods

Initial supported methods:

- Cash
- M-Pesa
- Paystack

Future:

- Bank
- Card
- Wallet

---

# 11. Receipt Rules

---

## BR-RCP-001

### Completed Sales Generate Receipts

### Rule

Every completed sale must generate a receipt number.

---

## BR-RCP-002

### Receipt Numbers Must Be Unique

Receipt numbering must never duplicate within an organization.

---

# 12. Tax Rules

---

## BR-TAX-001

### Tax Configuration Is Organization Specific

Each organization controls its tax settings.

---

## BR-TAX-002

### eTIMS Compliance

Where required, sales must support KRA eTIMS reporting requirements.

---

# 13. Synchronization Rules

---

## BR-SYNC-001

### Local Transactions Must Sync When Online

### Rule

Transactions created offline must synchronize when connectivity returns.

---

## BR-SYNC-002

### Synchronization Must Not Duplicate Transactions

The system must detect duplicate synchronization attempts.

---

# 14. Audit Rules

---

## BR-AUD-001

### Critical Actions Must Be Logged

Examples:

- Login
- Product deletion
- Price changes
- Refunds
- Permission changes

---

# 15. Rule Status

Possible statuses:

| Status     | Meaning                  |
| ---------- | ------------------------ |
| Draft      | Under discussion         |
| Approved   | Ready for implementation |
| Deprecated | No longer active         |
| Future     | Planned                  |
