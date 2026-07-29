# SmartShopPOS API Design Guide

## Document Information

| Property | Value |
|---|---|
| Document | API Design Guide |
| Product | SmartShopPOS |
| Version | 1.0.0 |
| Status | Approved |
| Owner | Backend Team |
| Last Updated | July 2026 |

---

# 1. Purpose

This document defines the API design standards for SmartShopPOS.

Objectives:

- Consistency
- Predictability
- Scalability
- Backward Compatibility
- Offline Support
- SaaS Readiness

---

# 2. API Philosophy

The API is the product.

Every client consumes the same API.

Clients include:

- Vue Dashboard
- Mobile App
- Desktop App
- Barcode Scanner
- Public Developers
- AI Assistant
- Future Plugins

---

# 3. Base URL

```
/api/v1
```

Examples

```
/api/v1/products

/api/v1/sales

/api/v1/customers
```

Never expose unversioned APIs.

---

# 4. Resource Naming

Use nouns.

Good

```
GET /products

GET /sales

GET /customers
```

Avoid

```
/getProducts

/createSale

/deleteProduct
```

HTTP verbs already describe the action.

---

# 5. HTTP Methods

GET

Retrieve resources

POST

Create resources

PUT

Replace

PATCH

Partial update

DELETE

Soft delete where applicable

---

# 6. API Versioning

Current

```
v1
```

Future

```
v2

v3
```

Breaking changes require a new version.

---

# 7. Multi-Tenant Routing

Every request belongs to one organization.

Resolved by:

JWT

or

Organization Header

Never expose organization IDs in URLs unless explicitly required.

---

# 8. Parameter-Based Design

Filtering

```
GET /products?category=beverages

GET /products?active=true

GET /products?supplier=123
```

Searching

```
GET /products?search=milk
```

Sorting

```
GET /products?sort=name

GET /products?sort=-createdAt
```

Pagination

```
GET /products?page=2&limit=50
```

Field Selection

```
GET /products?fields=id,name,price
```

Expansion

```
GET /products?expand=category,supplier
```

This keeps endpoints stable as features grow.

---

# 9. Standard CRUD

Products

GET    /products

GET    /products/:id

POST   /products

PATCH  /products/:id

DELETE /products/:id

The same pattern applies to every resource.

---

# 10. Nested Resources

Examples

```
GET /customers/{id}/sales

GET /products/{id}/inventory

GET /sales/{id}/payments
```

---

# 11. Bulk Operations

Supported.

Examples

```
POST /products/bulk-import

PATCH /products/bulk-update

DELETE /products/bulk-delete
```

---

# 12. Standard Response Envelope

Every successful response:

{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {},
  "links": {}
}

---

Errors

{
  "success": false,
  "error": {
      "code": "...",
      "message": "...",
      "details": []
  },
  "correlationId": "...",
  "timestamp": "..."
}

---

# 13. Pagination Format

{
  "page": 1,
  "limit": 20,
  "total": 580,
  "pages": 29
}

---

# 14. Filtering Rules

Support:

Equals

Contains

Starts With

Ends With

Between

Greater Than

Less Than

In List

Example

```
GET /products?price[gte]=100

GET /products?price[lte]=500

GET /products?category[in]=food,drinks
```

---

# 15. Date Filtering

```
GET /sales?createdAt[gte]=2026-07-01

GET /sales?createdAt[lte]=2026-07-31
```

---

# 16. Search

Universal search parameter

```
?search=
```

No module-specific names.

---

# 17. Soft Delete

Deleted records remain recoverable.

Queries support

```
?deleted=true

?deleted=false
```

---

# 18. Idempotency

Required for:

Payments

Webhooks

Synchronization

eTIMS

M-Pesa callbacks

Clients send:

Idempotency-Key header

---

# 19. Correlation ID

Every request receives:

X-Correlation-ID

Logged throughout the request lifecycle.

---

# 20. Swagger Standards

Every endpoint requires:

Summary

Description

Tags

Parameters

Request Example

Response Example

Error Responses

Security Definition

---

# 21. Authentication

JWT Bearer

Future:

API Keys

OAuth

---

# 22. Authorization

Permissions checked in middleware.

Never in controllers.

---

# 23. Rate Limiting

Public APIs

Authenticated APIs

Authentication endpoints

Webhook endpoints

Each configurable independently.

---

# 24. Webhooks

Incoming webhooks

/payments/webhooks/paystack

/payments/webhooks/mpesa

Require:

Signature validation

Idempotency

Logging

Retry handling

---

# 25. Offline Synchronization

Reserved endpoints

/sync/upload

/sync/download

/sync/status

/sync/conflicts

---

# 26. API Deprecation

Deprecated endpoints include:

Deprecation header

Replacement

Removal version

Documentation update

---

# 27. OpenAPI

Swagger generated automatically from Fastify route schemas.

Manual Swagger edits prohibited.

---

# 28. API Performance

Default page size:

20

Maximum page size:

100

Streaming required for exports.

---

# 29. API Observability

Every request records:

Organization

Branch

User

Device

IP

Latency

Status

Correlation ID

---

# 30. Future API Features

Reserved:

GraphQL

gRPC

Public SDK

Webhook subscriptions

Plugin APIs

AI APIs