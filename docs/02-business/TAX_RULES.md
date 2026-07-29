# SmartShopPOS Tax Rules Specification

## Document Information

| Property          | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| Document          | Tax Rules Specification                               |
| Product           | SmartShopPOS                                          |
| Version           | 0.1.0                                                 |
| Status            | Draft                                                 |
| Owner             | SmartShopPOS Product Team                             |
| Related Documents | BUSINESS_RULES_SPECIFICATION.md, DOMAIN_DICTIONARY.md |
| Last Updated      | July 2026                                             |

---

# 1. Purpose

This document defines the tax behavior required by SmartShopPOS.

The system must support:

- Kenyan tax requirements
- Future tax changes
- Multiple tax jurisdictions
- Different product tax categories

---

# 2. Tax Design Principles

SmartShopPOS tax handling follows these principles:

## Principle 1

Tax rules must be configurable.

The system must not hardcode tax percentages.

---

## Principle 2

Tax calculations must be transparent.

Users should understand:

- Product price
- Tax amount
- Final amount

---

## Principle 3

Historical transactions must preserve original tax information.

A future tax change must not alter old receipts.

---

## Principle 4

Tax compliance must support KRA eTIMS.

---

# 3. Kenyan Tax Context

SmartShopPOS Version 1 targets Kenya.

The system should support:

- VAT
- Zero-rated supplies
- Exempt supplies
- Non-VAT items
- eTIMS invoice requirements

---

# 4. Tax Concepts

---

# Tax

## Definition

A government-imposed charge applied to eligible goods or services.

---

# Tax Rate

## Definition

The percentage applied to a taxable amount.

Example:

VAT Rate

16%

---

# Tax Category

## Definition

A classification determining how a product is taxed.

Examples:

- Standard VAT
- Zero Rated
- Exempt
- Non-Taxable

---

# Tax Inclusive Pricing

## Definition

The displayed selling price already contains tax.

Example:

Shelf Price:

KES 116

VAT included.

---

# Tax Exclusive Pricing

## Definition

Tax is added after the base price.

Example:

Product:

KES 100

VAT:

KES 16

Total:

KES 116

---

# 5. Product Tax Rules

---

## BR-TAX-001

### Every Product Has A Tax Category

A product must belong to a tax category.

Example:

Product:

Milk 500ml

Tax Category:

Standard VAT

---

## BR-TAX-002

### Tax Category Cannot Change Historical Sales

Changing a product tax category only affects future transactions.

Previous sales retain their original tax information.

---

# 6. Tax Categories

Initial categories:

| Category    | Description          |
| ----------- | -------------------- |
| STANDARD    | Normal taxable goods |
| ZERO_RATED  | Taxable at 0%        |
| EXEMPT      | Not subject to VAT   |
| NON_TAXABLE | No tax applied       |

---

# 7. Sales Tax Calculation Rules

A sale calculation follows:

Product Price

Applicable Tax

=

Final Amount

---

# 8. Tax Calculation Order

The system must calculate:

Product subtotal

↓

Apply discounts

↓

Calculate taxable amount

↓

Calculate tax

↓

Calculate final total

↓

Generate receipt

---

# 9. Discount Tax Rules

Discounts must be applied before tax calculation.

Example:

Product:

KES 1,000

Discount:

KES 100

Taxable Amount:

KES 900

VAT calculated on:

KES 900

---

# 10. Receipt Tax Requirements

A receipt should contain:

Business Information

Tax Identification Information

Receipt Number

Date

Items

Quantity

Price

Tax Category

Tax Amount

Total Amount

Payment Details

---

# 11. eTIMS Requirements

SmartShopPOS should support:

- Electronic invoice generation
- Invoice numbering
- Tax information capture
- Transaction submission
- Response handling
- Error logging

---

# 12. eTIMS Integration Rules

---

## BR-TAX-010

### eTIMS Status Must Be Tracked

Every submission should have:

Status:

- Pending
- Submitted
- Accepted
- Rejected

---

## BR-TAX-011

### Failed eTIMS Submission Must Not Lose Sale Data

A failed tax submission must:

- Preserve the sale
- Record the error
- Allow retry

---

# 13. Tax Rounding Rules

SmartShopPOS must define rounding behavior.

Rules:

- Use consistent decimal precision
- Round only at defined calculation points
- Store calculated tax values

---

# 14. Multi-Country Preparation

Although Kenya is the first market, architecture should support:

Future:

- Uganda
- Tanzania
- Rwanda
- Other jurisdictions

Therefore:

Tax should belong to:

Organization

-

Jurisdiction

---

# 15. Tax Audit Rules

The system must record:

- Tax category used
- Tax rate used
- Calculated tax
- Submission status
- Changes to tax configuration

---

# 16. Future Tax Features

Reserved:

- Multiple VAT rates
- Excise duty
- Withholding tax
- Regional taxes
- Automated tax updates
- Tax reporting exports
