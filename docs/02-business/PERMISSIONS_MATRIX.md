# SmartShopPOS Permissions Matrix

## Document Information

| Property          | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| Document          | Permissions Matrix                                    |
| Product           | SmartShopPOS                                          |
| Version           | 0.1.0                                                 |
| Status            | Draft                                                 |
| Owner             | SmartShopPOS Product Team                             |
| Related Documents | BUSINESS_RULES_SPECIFICATION.md, DOMAIN_DICTIONARY.md |
| Last Updated      | July 2026                                             |

---

# 1. Purpose

This document defines the roles and permissions within SmartShopPOS.

Permissions determine what actions users can perform.

The system follows:

Role-Based Access Control (RBAC)

with future support for:

Attribute-Based Access Control (ABAC)

---

# 2. Security Model

SmartShopPOS authorization hierarchy:

Organization

↓

Branch

↓

User

↓

Role

↓

Permission

↓

Action

Example:

Organization

ABC Supermarket

|

Branch

Nairobi CBD

|

User

John

|

Role

Cashier

|

Permission

COMPLETE_SALE

---

# 3. Default Roles

SmartShopPOS Version 1 includes:

1. Organization Owner

2. Manager

3. Cashier

4. Inventory Clerk

5. Accountant

6. Auditor

---

# 4. Role Definitions

---

# Organization Owner

## Purpose

The highest authority within an organization.

## Responsibilities

- Business configuration
- User management
- Financial oversight
- System settings

## Permissions

Full access within organization.

---

# Manager

## Purpose

Manage daily business operations.

## Responsibilities

- Sales oversight
- Inventory management
- Staff supervision

---

# Cashier

## Purpose

Process customer transactions.

## Responsibilities

- Create sales
- Receive payments
- Print receipts

---

# Inventory Clerk

## Purpose

Manage stock operations.

## Responsibilities

- Receive stock
- Update inventory
- Perform stock counts

---

# Accountant

## Purpose

Manage financial information.

## Responsibilities

- Reports
- Financial analysis
- Tax information

---

# Auditor

## Purpose

Review system activity.

## Responsibilities

- View logs
- Review transactions
- Verify compliance

---

# 5. Permission Naming Convention

Format:

MODULE_ACTION

Examples:

PRODUCT_CREATE

SALE_COMPLETE

PAYMENT_REFUND

REPORT_VIEW

---

# 6. Permission Categories

---

# Organization Permissions

| Permission    | Description                  |
| ------------- | ---------------------------- |
| ORG_VIEW      | View organization details    |
| ORG_UPDATE    | Update organization settings |
| ORG_DELETE    | Delete organization          |
| ORG_CONFIGURE | Configure system settings    |

---

# User Permissions

| Permission       | Description   |
| ---------------- | ------------- |
| USER_CREATE      | Create users  |
| USER_UPDATE      | Edit users    |
| USER_DISABLE     | Disable users |
| USER_ASSIGN_ROLE | Assign roles  |

---

# Product Permissions

| Permission           | Description           |
| -------------------- | --------------------- |
| PRODUCT_CREATE       | Create products       |
| PRODUCT_VIEW         | View products         |
| PRODUCT_UPDATE       | Update products       |
| PRODUCT_DELETE       | Delete products       |
| PRODUCT_CHANGE_PRICE | Change product prices |

---

# Inventory Permissions

| Permission         | Description      |
| ------------------ | ---------------- |
| INVENTORY_VIEW     | View stock       |
| INVENTORY_RECEIVE  | Receive stock    |
| INVENTORY_ADJUST   | Adjust inventory |
| INVENTORY_TRANSFER | Transfer stock   |

---

# Sales Permissions

| Permission    | Description       |
| ------------- | ----------------- |
| SALE_CREATE   | Create sale       |
| SALE_COMPLETE | Complete sale     |
| SALE_CANCEL   | Cancel sale       |
| SALE_VIEW     | View sales        |
| SALE_EDIT     | Edit pending sale |

---

# Payment Permissions

| Permission      | Description     |
| --------------- | --------------- |
| PAYMENT_RECEIVE | Receive payment |
| PAYMENT_VIEW    | View payments   |
| PAYMENT_REFUND  | Process refunds |
| PAYMENT_VOID    | Void payment    |

---

# Customer Permissions

| Permission      | Description     |
| --------------- | --------------- |
| CUSTOMER_CREATE | Create customer |
| CUSTOMER_VIEW   | View customer   |
| CUSTOMER_UPDATE | Update customer |
| CUSTOMER_DELETE | Delete customer |

---

# Supplier Permissions

| Permission      | Description     |
| --------------- | --------------- |
| SUPPLIER_CREATE | Create supplier |
| SUPPLIER_VIEW   | View suppliers  |
| SUPPLIER_UPDATE | Update supplier |

---

# Reporting Permissions

| Permission       | Description            |
| ---------------- | ---------------------- |
| REPORT_VIEW      | View reports           |
| REPORT_EXPORT    | Export reports         |
| REPORT_FINANCIAL | View financial reports |

---

# Audit Permissions

| Permission   | Description       |
| ------------ | ----------------- |
| AUDIT_VIEW   | View audit logs   |
| AUDIT_EXPORT | Export audit data |

---

# 7. Role Permission Matrix

Legend:

✅ Allowed

❌ Not Allowed

🔒 Restricted Approval Required

| Permission      | Owner | Manager | Cashier | Inventory Clerk | Accountant | Auditor |
| --------------- | ----- | ------- | ------- | --------------- | ---------- | ------- |
| View Dashboard  | ✅    | ✅      | Limited | Limited         | ✅         | ✅      |
| Create Product  | ✅    | ✅      | ❌      | ✅              | ❌         | ❌      |
| Change Price    | ✅    | 🔒      | ❌      | ❌              | ❌         | ❌      |
| Delete Product  | ✅    | 🔒      | ❌      | ❌              | ❌         | ❌      |
| Receive Stock   | ✅    | ✅      | ❌      | ✅              | ❌         | ❌      |
| Adjust Stock    | ✅    | 🔒      | ❌      | 🔒              | ❌         | ❌      |
| Create Sale     | ✅    | ✅      | ✅      | ❌              | ❌         | ❌      |
| Complete Sale   | ✅    | ✅      | ✅      | ❌              | ❌         | ❌      |
| Cancel Sale     | ✅    | 🔒      | ❌      | ❌              | ❌         | ❌      |
| Refund Payment  | ✅    | 🔒      | ❌      | ❌              | ❌         | ❌      |
| View Reports    | ✅    | ✅      | Limited | Limited         | ✅         | ✅      |
| Manage Users    | ✅    | 🔒      | ❌      | ❌              | ❌         | ❌      |
| View Audit Logs | ✅    | 🔒      | ❌      | ❌              | ❌         | ✅      |

---

# 8. Branch Access Rules

Users may have:

- Single branch access
- Multiple branch access
- Organization-wide access

Example:

Cashier:

Branch A only

Owner:

All branches

---

# 9. Approval Workflows

Some actions require approval.

Examples:

## Refund

Cashier:

Request refund

↓

Manager:

Approve

↓

System:

Process refund

---

## Price Change

Employee:

Request change

↓

Manager:

Approve

↓

Product Updated

---

# 10. Permission Security Rules

## Rule 1

Permissions are checked on the backend.

Frontend restrictions alone are insufficient.

---

## Rule 2

Every sensitive action requires audit logging.

Examples:

- Refund
- Delete
- Price change
- Permission change

---

## Rule 3

Users cannot grant permissions they do not possess.

---

# 11. Future Authorization Features

Reserved:

- Custom Roles
- Department Permissions
- Time-Based Permissions
- Location Restrictions
- Approval Chains
