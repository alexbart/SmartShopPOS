# SmartShopPOS Error Handling Standard

## Document Information

| Property     | Value                   |
| ------------ | ----------------------- |
| Document     | Error Handling Standard |
| Product      | SmartShopPOS            |
| Version      | 1.0.0                   |
| Status       | Approved                |
| Owner        | Core Engineering Team   |
| Last Updated | July 2026               |

---

# 1. Purpose

This document defines how errors are created, propagated, logged, displayed, and monitored within SmartShopPOS.

Objectives:

- Consistent error responses
- Better debugging
- Improved user experience
- Reliable monitoring
- Secure information disclosure

---

# 2. Error Philosophy

Errors are expected.

They should never:

- Crash the application
- Leak sensitive information
- Corrupt business data
- Leave transactions in an unknown state

Every error should be:

- Predictable
- Actionable
- Logged
- Traceable

---

# 3. Error Categories

SmartShopPOS classifies errors into the following categories:

## Validation Errors

Example:

- Missing required field
- Invalid email
- Negative quantity

HTTP Status

400 Bad Request

---

## Authentication Errors

Example:

- Missing token
- Expired token
- Invalid token

HTTP Status

401 Unauthorized

---

## Authorization Errors

Example:

- User lacks permission

HTTP Status

403 Forbidden

---

## Not Found

Example:

- Product not found
- Customer not found

HTTP Status

404 Not Found

---

## Conflict Errors

Example:

- Duplicate barcode
- Duplicate SKU
- Concurrent update

HTTP Status

409 Conflict

---

## Business Rule Violations

Example:

- Selling out-of-stock item
- Closing an already closed shift
- Refunding more than paid

HTTP Status

422 Unprocessable Entity

---

## External Service Errors

Example:

- M-Pesa timeout
- Paystack unavailable
- eTIMS unavailable

HTTP Status

502 Bad Gateway

or

503 Service Unavailable

---

## Internal Errors

Unexpected system failures.

HTTP Status

500 Internal Server Error

---

# 4. Standard Error Response

Every API error returns:

{
"success": false,
"error": {
"code": "SALE_OUT_OF_STOCK",
"message": "Product is out of stock.",
"details": []
},
"correlationId": "9b6d...",
"timestamp": "2026-07-29T09:45:00Z"
}

---

# 5. Error Code Naming

Format:

MODULE_REASON

Examples

AUTH_INVALID_TOKEN

SALE_OUT_OF_STOCK

PRODUCT_NOT_FOUND

PAYMENT_TIMEOUT

SYNC_CONFLICT

ETIMS_SUBMISSION_FAILED

---

# 6. User-Friendly Messages

API returns safe messages.

Example

Internal Error

Database connection timeout.

Customer Sees

"Unable to process your request. Please try again."

Developers see detailed logs.

---

# 7. Exception Hierarchy

Base Error

↓

ValidationError

↓

BusinessRuleError

↓

AuthenticationError

↓

AuthorizationError

↓

ConflictError

↓

ExternalServiceError

↓

InternalServerError

---

# 8. Global Error Handler

Fastify shall use one centralized error handler.

Responsibilities:

- Normalize errors
- Log errors
- Generate response
- Hide internal details

Controllers must never format errors manually.

---

# 9. Validation Errors

Validation errors should include:

Field

Constraint

Received Value

Example

{
"field":"quantity",
"message":"Quantity must be greater than zero."
}

---

# 10. External Integrations

Integration failures should include:

Provider

Operation

Retryable

Correlation ID

Latency

Status

Example

Provider

M-Pesa

Operation

STK Push

Retry

Yes

---

# 11. Offline Errors

Offline mode must distinguish:

Local success

Cloud sync pending

Cloud sync failed

Conflict detected

---

# 12. Retry Policy

Retry automatically for:

- Network timeout
- Temporary provider outage
- Synchronization

Do not retry:

- Validation errors
- Permission failures
- Duplicate requests

---

# 13. Transaction Rollback

Critical operations use transactions.

If one step fails:

Rollback everything.

Examples:

Sale

↓

Payment

↓

Inventory

↓

Receipt

If inventory update fails:

Entire transaction rolls back.

---

# 14. Error Logging

Every error logs:

Timestamp

Organization

Branch

User

Request ID

Correlation ID

Module

Stack Trace

Severity

---

# 15. Security Rules

Never expose:

Database schema

SQL queries

Stack traces

Passwords

Secrets

API keys

Tokens

---

# 16. Monitoring

Track:

Validation errors

Payment failures

Sync failures

Authentication failures

API failures

Database failures

---

# 17. Error Metrics

Dashboard should show:

Top 10 errors

Most failing endpoint

Most failing integration

Average failures/day

Mean Time To Recovery

---

# 18. Future Enhancements

Reserved:

- Automatic retries
- AI error classification
- Self-healing jobs
- Intelligent alerting
- Root cause suggestions
