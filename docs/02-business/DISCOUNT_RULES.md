# SmartShopPOS Discount Rules Specification

## Document Information

| Property          | Value                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| Document          | Discount Rules Specification                                             |
| Product           | SmartShopPOS                                                             |
| Version           | 0.1.0                                                                    |
| Status            | Draft                                                                    |
| Owner             | SmartShopPOS Product Team                                                |
| Related Documents | PRICING_RULES.md, BUSINESS_RULES_SPECIFICATION.md, PERMISSIONS_MATRIX.md |
| Last Updated      | July 2026                                                                |

---

# 1. Purpose

This document defines how discounts are created, approved, applied, audited, and reported within SmartShopPOS.

The objective is to provide flexible pricing while preventing unauthorized revenue loss and fraud.

---

# 2. Design Principles

## Principle 1

Discounts never modify the product's base selling price.

They are applied only during transactions.

---

## Principle 2

Every discount must be traceable.

The system shall record:

- User
- Date
- Time
- Reason
- Amount
- Approval (if required)

---

## Principle 3

Historical discounts remain unchanged.

Changing discount policies does not alter completed sales.

---

## Principle 4

Discounts are configurable.

Organizations define:

- Maximum discount
- Approval workflow
- Eligible users
- Eligible products

---

# 3. Discount Types

SmartShopPOS supports:

• Percentage Discount

• Fixed Amount Discount

• Line Item Discount

• Cart Discount

• Customer Discount

• Promotional Discount

• Quantity Discount

• Loyalty Discount (Future)

---

# 4. Discount Scope

Discounts may apply to:

- Entire Sale
- Individual Product
- Product Category
- Customer Group
- Promotion Campaign

---

# 5. Business Rules

---

## BR-DISC-001

Every Discount Requires A Reason

Examples:

- Damaged packaging

- Customer loyalty

- Promotion

- Staff authorization

---

## BR-DISC-002

Discounts Cannot Produce Negative Prices

Final selling price must always be greater than or equal to zero.

---

## BR-DISC-003

Maximum Discount Is Configurable

Each organization defines its own limits.

Example

Cashier

5%

Supervisor

15%

Manager

30%

Owner

Unlimited

---

## BR-DISC-004

Unauthorized Discounts Are Rejected

Users without permission cannot apply restricted discounts.

---

## BR-DISC-005

Discount Approval Is Mandatory Above Configured Threshold

Example

Requested:

18%

Cashier Limit:

5%

↓

Manager Approval Required

---

## BR-DISC-006

Approved Discounts Record Approver Information

System stores:

Approver

Approval Date

Approval Method

Reason

---

## BR-DISC-007

Manual Discounts Override Automatic Promotions

Priority:

Manual Discount

↓

Promotion

↓

Customer Discount

↓

Default Price

---

# 6. Promotion Rules

Promotions require:

- Name
- Start Date
- End Date
- Eligible Products
- Eligible Customers
- Status

---

## BR-DISC-008

Expired Promotions Cannot Be Applied

The system automatically disables expired promotions.

---

## BR-DISC-009

Disabled Promotions Cannot Affect Pricing

Only active promotions participate in pricing.

---

# 7. Quantity Discounts

Example

1–4 Units

No Discount

5–9 Units

5%

10–19 Units

10%

20+

15%

---

## BR-DISC-010

Highest Eligible Quantity Discount Applies

Only one quantity discount is applied unless stacking is enabled.

---

# 8. Discount Stacking Rules

Default behavior:

No stacking.

Priority:

Manual Discount

↓

Promotion

↓

Customer Discount

↓

Quantity Discount

Organizations may enable controlled stacking.

---

# 9. Restricted Products

Some products may prohibit discounts.

Examples:

- Gift Cards

- Cigarettes (subject to local regulations)

- Prescription Medicine (where applicable)

- Promotional Bundles

---

## BR-DISC-011

Restricted Products Ignore Unauthorized Discounts

Only authorized users may override restrictions.

---

# 10. Refund Interaction

Refunds use the original discounted price.

Example

Original Price

KES 1,000

Discount

KES 100

Paid

KES 900

Refund

KES 900

---

# 11. Audit Requirements

Every discount records:

- Sale ID
- Product
- Original Price
- Discount Type
- Discount Value
- Final Price
- User
- Approval
- Timestamp
- Device
- Branch

---

# 12. Reporting

Reports include:

- Total Discounts
- Discounts by User
- Discounts by Branch
- Discounts by Product
- Discount Reasons
- Lost Revenue
- Promotion Performance

---

# 13. Fraud Detection

Future AI module may detect:

- Unusual discount frequency
- Excessive discounts
- Discounts outside business hours
- Employee abuse
- Repeated discounts for same customer

---

# 14. Future Features

Reserved for:

- Coupon Codes

- Membership Discounts

- Birthday Discounts

- Employee Discounts

- Referral Discounts

- Campaign Discounts

- AI Pricing Recommendations
