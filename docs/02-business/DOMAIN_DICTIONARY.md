# SmartShopPOS Domain Dictionary

## Document Information

| Property          | Value                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| Document          | Domain Dictionary                                                        |
| Product           | SmartShopPOS                                                             |
| Version           | 0.1.0                                                                    |
| Status            | Draft                                                                    |
| Owner             | SmartShopPOS Product Team                                                |
| Related Documents | MASTER_PLAN.md, PRODUCT_REQUIREMENTS.md, BUSINESS_RULES_SPECIFICATION.md |
| Last Updated      | July 2026                                                                |

---

# 1. Purpose

This document defines the official business terminology used throughout SmartShopPOS.

All product, engineering, database, API, UI, and documentation decisions should use the definitions in this document.

If a new concept is introduced, it must be added here before implementation.

---

# 2. Core Platform Concepts

---

# Organization

## Definition

An Organization represents a legally independent business using SmartShopPOS.

Examples:

- A retail shop
- A supermarket company
- A wholesaler

## Characteristics

An organization owns:

- Products
- Branches
- Users
- Customers
- Sales
- Inventory
- Settings
- Reports

## Technical Equivalent

Tenant

---

# Tenant

## Definition

A tenant is a technical representation of an isolated customer environment inside the SmartShopPOS SaaS platform.

## Relationship

One Tenant = One Organization

---

# Branch

## Definition

A Branch represents a physical business location belonging to an organization.

Examples:

- Nairobi CBD Store
- Eldoret Branch
- Warehouse

## Characteristics

A branch has:

- Address
- Users
- Inventory
- Sales
- Settings

---

# User

## Definition

A User is an individual person who accesses SmartShopPOS.

Examples:

- Owner
- Manager
- Cashier

A user belongs to an organization and may have access to one or more branches.

---

# Role

## Definition

A Role defines a collection of permissions assigned to users.

Examples:

- Owner
- Manager
- Cashier
- Accountant

---

# Permission

## Definition

A Permission defines a specific action a user can perform.

Examples:

- CREATE_PRODUCT
- COMPLETE_SALE
- REFUND_PAYMENT
- VIEW_REPORTS

---

# Product Concepts

---

# Product

## Definition

A Product represents an item or service that a business sells.

Examples:

- Coca Cola 500ml
- Laptop
- Phone Repair Service

## A Product Contains

- Name
- SKU
- Barcode
- Category
- Cost Price
- Selling Price
- Tax Configuration

---

# SKU

## Definition

Stock Keeping Unit.

A unique internal identifier used by a business to identify a product.

Example:
