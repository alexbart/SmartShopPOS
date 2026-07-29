# SmartShopPOS Coding Standards

## Document Information

| Property     | Value                 |
| ------------ | --------------------- |
| Document     | Coding Standards      |
| Product      | SmartShopPOS          |
| Version      | 1.0.0                 |
| Status       | Development Blueprint |
| Owner        | Engineering Team      |
| Last Updated | July 2026             |

---

# 1. Purpose

This document defines coding standards for SmartShopPOS.

The goal is:

- Maintain clean code
- Improve collaboration
- Reduce bugs
- Support AI-assisted development
- Ensure long-term maintainability

---

# 2. Core Principles

SmartShopPOS follows:

## Clean Architecture

Code should have clear responsibilities.

---

## Separation of Concerns

Controllers handle requests.

Services handle business logic.

Repositories handle data access.

---

## Explicit Over Clever

Readable code is preferred over shortcuts.

---

## Consistency

Similar problems should have similar solutions.

---

# 3. Language Standards

Primary language:

TypeScript

---

Required:

Strict mode enabled.

Example:

````json
{
"strict": true
}

Avoid:

any

unless absolutely necessary.

Prefer:

unknown

with proper validation.

4. Naming Conventions
Files

Use:

kebab-case

Example:

product.service.ts

sale.controller.ts

Classes

Use:

PascalCase

Example:

class ProductService {}
Variables

Use:

camelCase

Example:

const productName = "Phone";
Constants

Use:

UPPER_SNAKE_CASE

Example:

const MAX_LOGIN_ATTEMPTS = 5;
5. Module Structure

Every module follows:

module/

├── controller/

├── service/

├── repository/

├── routes/

├── schemas/

├── types/

├── events/

└── tests/

6. Controller Rules

Controllers should:

Receive requests
Validate input
Call services
Return responses

Controllers should NOT:

Contain business logic
Access database directly
Calculate prices

Example:

Good:

controller

↓

service

↓

repository


Bad:

controller

↓

prisma.product.findMany()

7. Service Rules

Services contain business logic.

Examples:

Calculate totals
Apply discounts
Validate stock
Process payments

Example:

sale.service.ts


contains:

createSale()

calculateTotal()

processRefund()

8. Repository Rules

Repositories handle database communication.

Example:

product.repository.ts


contains:

findProduct()

createProduct()

updateProduct()


Repositories do not:

Validate business rules
Send emails
Process payments
9. Prisma Rules

Prisma access is restricted.

Allowed:

repository layer

Forbidden:

controller
service
routes


Example:

Correct:

ProductService

↓

ProductRepository

↓

Prisma

10. Validation Standards

All external input must be validated.

Sources:

API requests
Environment variables
External webhooks

Technology:

Zod

Example:

Request

↓

Zod Schema

↓

Controller

11. API Response Standards

All APIs return consistent responses.

Success:

{
"success": true,
"data": {},
"message": "Operation successful"
}

Error:

{
"success": false,
"error": {
 "code":"PRODUCT_NOT_FOUND",
 "message":"Product does not exist"
}
}
12. HTTP Status Rules

Use correct status codes.

Examples:

200

Successful request.

201

Created resource.

400

Validation failure.

401

Authentication failure.

403

Permission denied.

404

Resource missing.

500

Unexpected error.

13. Error Handling

Never throw random errors.

Bad:

throw new Error("failed")

Good:

throw new AppError(
"PRODUCT_NOT_FOUND",
"Product does not exist"
)

Common errors:

AuthenticationError

ValidationError

NotFoundError

PermissionError

ConflictError

14. Logging Standards

Use:

Pino Logger

Every important action logs:

User
Organization
Action
Result

Example:

SALE_CREATED

USER_LOGIN

PAYMENT_FAILED


Never log:

Passwords
Tokens
Payment secrets
15. Async Programming

Always handle promises.

Avoid:

promise.then()

chains.

Prefer:

await

Example:

const product =
await productService.find(id);
16. Database Transactions

Required for:

Sales
Payments
Inventory changes
Refunds

Example:

Create Sale

+

Update Inventory

+

Create Payment

+

Create Audit Log


must happen together.

17. Type Definitions

Shared business types belong in:

packages/types

Do not duplicate:

Product interface


in multiple modules.

18. Environment Variables

Never hardcode:

Secrets

URLs

Keys

Passwords

Use:

.env

.env.example

19. Comments

Comments explain:

WHY.

Not:

WHAT.

Bad:

// increase count by one
count++

Good:

// Inventory is updated through movements
// to preserve audit history
20. Testing Standards

Every feature requires:

Unit Tests

Business logic.

Integration Tests

Database/API interaction.

End-to-End Tests

User workflows.

21. Test Naming

Use:

should_do_expected_behavior


Example:

should_prevent_sale_when_stock_is_zero

22. Git Standards

Use:

Conventional Commits.

Format:

type(scope): message

Examples:

feat(products): add barcode scanning

fix(payments): handle mpesa timeout

docs(api): update swagger docs

23. Branch Standards

Branches:

main

develop

feature/name

bugfix/name

hotfix/name

24. Pull Request Requirements

Before merge:

Required:

✓ Tests pass

✓ Lint passes

✓ Review completed

✓ Documentation updated

25. AI Coding Rules

AI generated code must:

Follow module structure
Use existing patterns
Add tests
Update documentation
Avoid duplicate logic
Explain architectural decisions
26. Security Rules

Never:

Commit secrets.

Disable authentication.

Skip validation.

Always:

Validate input.

Authorize actions.

Log sensitive operations.

27. Performance Rules

Avoid:

Unnecessary database queries.

Large unpaginated responses.

Blocking operations.

Use:

Pagination.

Caching.

Indexes.

Background jobs.

28. Final Decision

SmartShopPOS follows strict TypeScript, Fastify, Prisma, PostgreSQL, testing, security, and architectural standards to ensure a scalable SaaS-grade product.


---

# 🏗 Chief Architect Review

Now we have established the development culture.

A few important things to highlight:

---

## 1. Prisma Protection

This rule is important:


Controller
❌
Service
❌
Repository
✅
Prisma


This prevents the common problem:

```typescript
// everywhere in the application

prisma.user.findMany()

Six months later nobody knows where database logic lives.

2. AI Agent Instruction

When using your AI assistant, we can now prompt:

"Implement the Product module according to SmartShopPOS Coding Standards."

The agent has boundaries.

3. Production Quality Target

We are not building:

small CRUD app

We are building:

Kenyan retail SaaS platform

Therefore:

documentation first
architecture first
testing first
````
