# SmartShopPOS Pricing Rules Specification

## Document Information

| Property          | Value                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Document          | Pricing Rules Specification                                         |
| Product           | SmartShopPOS                                                        |
| Version           | 0.1.0                                                               |
| Status            | Draft                                                               |
| Owner             | SmartShopPOS Product Team                                           |
| Related Documents | BUSINESS_RULES_SPECIFICATION.md, TAX_RULES.md, DOMAIN_DICTIONARY.md |
| Last Updated      | July 2026                                                           |

---

# 1. Purpose

This document defines how SmartShopPOS manages product pricing.

The pricing system must support:

- Small retail shops
- Wholesale businesses
- Multiple branches
- Different customer types
- Promotions
- Discounts
- Future pricing extensions

---

# 2. Pricing Principles

## Principle 1

Prices must be configurable.

The system must not assume one fixed price per product.

---

## Principle 2

Historical sales must preserve the price used at the time of purchase.

A future price change must not modify previous transactions.

---

## Principle 3

Pricing decisions must be traceable.

Every important price change must be recorded.

---

## Principle 4

Pricing must support future business growth.

The system must support:

- Retail
- Wholesale
- Enterprise pricing

---

# 3. Pricing Concepts

---

# Cost Price

## Definition

The amount paid by the business to acquire a product.

Example:

Supplier cost:

KES 80

---

# Selling Price

## Definition

The amount charged to a customer.

Example:

Selling price:

KES 100

---

# Profit Margin

## Definition

The difference between selling price and cost price.

Example:

Cost:

KES 80

Selling:

KES 100

Profit:

KES 20

---

# Price List

## Definition

A collection of prices applied to products.

Examples:

- Retail Price List
- Wholesale Price List
- VIP Customer Price List

---

# Customer Type

## Definition

A classification used to determine pricing rules.

Examples:

- Retail Customer
- Wholesale Customer
- VIP Customer

---

# Discount

## Definition

A reduction applied to the normal selling price.

---

# Promotion

## Definition

A temporary pricing strategy used to increase sales.

Examples:

- Buy One Get One
- Weekend Sale
- Bulk Discount

---

# 4. Product Pricing Rules

---

## BR-PRICE-001

### Every Sellable Product Requires A Selling Price

A product cannot be sold without a valid selling price.

---

## BR-PRICE-002

### Cost Price Is Optional But Recommended

Businesses may operate without entering supplier costs.

However, profit reporting requires cost information.

---

## BR-PRICE-003

### Product Prices Are Organization Specific

The same product may have different prices in different organizations.

Example:

Organization A:

KES 100

Organization B:

KES 120

---

# 5. Price History Rules

---

## BR-PRICE-004

### Price Changes Must Be Recorded

Every price update must capture:

- Previous price
- New price
- User responsible
- Date
- Reason

---

Example:

Product:

Sugar 1kg

Old Price:

KES 150

New Price:

KES 160

Changed By:

Manager

Reason:

Supplier price increase

---

# 6. Branch Pricing Rules

---

## BR-PRICE-005

### Branch Specific Pricing Is Supported

A business may configure different prices per branch.

Example:

Nairobi Branch:

KES 100

Mombasa Branch:

KES 110

---

# 7. Customer Pricing Rules

---

## BR-PRICE-006

### Customer Groups May Have Different Prices

Example:

Retail Customer:

KES 100

Wholesale Customer:

KES 90

---

# 8. Discount Rules

---

## BR-PRICE-007

### Discounts Must Be Controlled

Discount permissions depend on user role.

Example:

Cashier:

Maximum 5%

Manager:

Maximum 20%

Owner:

Unlimited

---

## BR-PRICE-008

### Discounts Must Be Recorded

Every discount must store:

- Amount
- Percentage
- Reason
- User
- Approval information

---

# 9. Promotion Rules

---

## BR-PRICE-009

### Promotions Must Have Valid Dates

A promotion requires:

- Start date
- End date

---

## BR-PRICE-010

### Expired Promotions Cannot Apply

The system must automatically stop expired promotions.

---

# 10. Bulk Pricing Rules

---

## BR-PRICE-011

### Quantity-Based Pricing Is Supported

Example:

Normal price:

KES 100

Buying 10+ units:

KES 90

---

# 11. Profit Rules

---

## BR-PRICE-012

### Profit Calculation Uses Transaction Price

Profit reporting must use:

Actual selling price

minus

Recorded cost price

---

# 12. Price Calculation Order

SmartShopPOS calculates final price in this order:

Base Product Price

↓

Customer Pricing Rule

↓

Branch Pricing Rule

↓

Quantity Discount

↓

Promotion

↓

Manual Discount

↓

Tax Calculation

↓

Final Amount

---

# 13. Price Override Rules

---

## BR-PRICE-013

### Manual Price Override Requires Permission

Cashiers cannot freely change prices.

---

## BR-PRICE-014

### Price Overrides Require Audit Logging

System records:

- Original price
- New price
- User
- Reason

---

# 14. Currency Rules

---

## BR-PRICE-015

### Organization Currency Is Configurable

Initial default:

KES

Future support:

Multiple currencies

---

# 15. Future Pricing Features

Reserved:

- Dynamic pricing
- Competitor pricing
- AI pricing recommendations
- Customer loyalty pricing
- Seasonal pricing
- Subscription pricing
- Marketplace pricing
