# SmartShopPOS API Development Guide

## Document Information

| Property     | Value                 |
| ------------ | --------------------- |
| Document     | API Development Guide |
| Product      | SmartShopPOS          |
| Version      | 1.0.0                 |
| Status       | Development Blueprint |
| Owner        | Engineering Team      |
| Last Updated | July 2026             |

---

# 1. Purpose

This document defines API development standards for SmartShopPOS.

The API must support:

- Web applications
- Desktop POS clients
- Mobile applications
- Third-party integrations
- Future SaaS expansion

---

# 2. API Architecture

SmartShopPOS uses:

REST API Architecture

Backend:

Fastify

TypeScript

OpenAPI Specification

---

# 3. API Versioning

All APIs must be versioned.

Format:

/api/v1/

Example:

GET

/api/v1/products

---

Future versions:

/api/v2/products

---

# 4. Base URL Structure

Production:

https://api.smartshoppos.com/api/v1

Development:

http://localhost:4000/api/v1

---

# 5. Endpoint Naming Rules

Use:

Plural nouns.

Correct:

/products

/customers

/sales

/payments

Incorrect:

/getProducts

/createSale

---

# 6. HTTP Methods

## GET

Retrieve data.

Example:

GET /products

---

## POST

Create resource.

Example:

POST /products

---

## PUT

Full update.

Example:

PUT /products/:id

---

## PATCH

Partial update.

Example:

PATCH /products/:id/status

---

## DELETE

Soft delete.

Example:

DELETE /products/:id

---

# 7. Resource Parameters

SmartShopPOS uses parameter-based endpoints.

Example:

GET /organizations/:organizationId/products/:productId

---

Reason:

Supports:

- Multi tenancy
- Future scaling
- Clear ownership
- Better authorization

---

# 8. Organization Context

Every request belongs to:

organizationId

Source:

JWT token.

Example:

Authorization:

Bearer token

contains:

{
userId,
organizationId,
role
}

---

# 9. Authentication

SmartShopPOS uses:

JWT Authentication.

Header:

Authorization:
Bearer <token>

---

# 10. Authorization

Authentication:

"Who are you?"

Authorization:

"What can you do?"

---

Example:

Cashier:

Can:

Create Sale

Cannot:

Delete Product

---

# 11. Standard API Response

All successful responses:

````json
{
 "success": true,
 "data": {},
 "message": "Success"
}

Example:

GET Product:

{
 "success":true,
 "data":{
   "id":"123",
   "name":"Milk",
   "price":100
 }
}
12. Error Response

Standard:

{
 "success":false,
 "error":{
   "code":"PRODUCT_NOT_FOUND",
   "message":"Product does not exist"
 }
}
13. Error Codes

Format:

DOMAIN_ACTION_REASON

Examples:

PRODUCT_NOT_FOUND

USER_ALREADY_EXISTS

PAYMENT_FAILED

STOCK_INSUFFICIENT

14. Pagination

All list endpoints must support pagination.

Example:

GET /products?page=1&limit=20

Response:

{
 "data":[
 ],

 "pagination":{
   "page":1,
   "limit":20,
   "total":500
 }
}
15. Filtering

Supported:

Example:

GET /products?categoryId=123

Examples:

GET /sales?dateFrom=2026-01-01

GET /products?stockStatus=LOW
16. Sorting

Format:

sortBy=

sortOrder=

Example:

GET /products?
sortBy=price&
sortOrder=desc
17. Searching

Search endpoints support:

Example:

GET /products/search?q=milk

Search fields:

Name
SKU
Barcode
18. API Validation

Every request requires:

Schema validation.

Technology:

Zod

Flow:

Request

↓

Zod Schema

↓

Controller

↓

Service

19. Swagger Documentation

Every endpoint MUST include:

Summary

Example:

Create new product
Description

Example:

Creates a product under an organization.
Requires inventory manager permission.
Request Schema

Example:

{
"name":"Sugar",
"price":150
}
Response Schema

Example:

{
"id":"123",
"name":"Sugar"
}
20. Swagger Availability

Development:

/docs

Example:

http://localhost:4000/docs

Production:

Can be:

Enabled

or

Protected behind admin access.

21. Module API Structure

Each module owns:

routes

schemas

controllers

services

repositories

Example:

products/

routes/

product.routes.ts

schemas/

product.schema.ts

22. Core API Modules

Initial modules:

Authentication

Organizations

Users

Roles

Branches

Products

Categories

Inventory

Customers

Sales

Payments

Reports

Integrations

23. Sales API Example

Create Sale:

POST

/api/v1/organizations/:organizationId/sales

Request:

{
"items":[
 {
  "productId":"123",
  "quantity":2
 }
],

"paymentMethod":"MPESA"
}

Response:

{
"success":true,

"data":{
 "saleId":"abc123",
 "receiptNumber":"RCP001"
}
}
24. Payment API

Create Payment:

POST

/api/v1/payments

Callback:

POST

/api/v1/payments/webhooks/mpesa

Webhook rules:

Validate signature
Prevent duplicates
Log response
25. eTIMS API

Internal endpoint:

POST

/api/v1/integrations/etims/invoices

Responsibilities:

Generate invoice payload
Submit to KRA
Store response
Retry failures
26. API Security Rules

Every endpoint must check:

Authentication
Organization ownership
Permission level
Input validation
27. Rate Limiting

Sensitive endpoints require limits:

Examples:

Login:

5 requests/minute

Payment callbacks:

Controlled retries
28. Audit Logging

Important actions create logs:

Examples:

PRODUCT_CREATED

SALE_COMPLETED

PAYMENT_RECEIVED

USER_PERMISSION_CHANGED

29. API Testing Requirements

Every endpoint requires:

Success test
Validation test
Authentication test
Permission test
30. Future API Support

Architecture allows:

GraphQL layer
Mobile APIs
Partner APIs
Marketplace integrations
Final Decision

SmartShopPOS APIs follow REST principles, versioned routes, organization-aware endpoints, strict validation, Swagger documentation, and enterprise-grade security standards.


---

# 🏗 Chief Architect Review

A few important choices are now locked.

---

## 1. Params-Based Scaling

You requested:

> params based endpoints for scaling later

We now have:

Example:


/organizations/:organizationId/products/:productId


This prepares us for:

- Multiple businesses
- Multiple branches
- Enterprise accounts

---

## 2. Frontend Developer Independence

The frontend developer can now work from:


/docs


Swagger becomes the single source of truth.

They know:

- endpoint
- parameters
- payload
- response
- errors

---

## 3. AI Agent Instructions

Our AI agent can now be instructed:

> "Create the Customer module following API_DEVELOPMENT_GUIDE.md and CODING_STANDARDS.md."

The generated code should automatically follow our architecture.

---

# Development Progress

```text
05-development/
````
