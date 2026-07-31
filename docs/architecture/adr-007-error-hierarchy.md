# ADR-007: Business error hierarchy for HTTP mapping

## Status
Accepted

## Context
The codebase previously used generic `Error` objects with ad-hoc `code` and `statusCode` properties. This led to inconsistent error responses and no type safety.

## Decision
- `BusinessError` is the abstract base class with `statusCode` and `code` properties.
- Subclasses: `ValidationError` (400), `NotFoundError` (404), `ConflictError` (409), `InsufficientStockError` (409), `PermissionDeniedError` (403).
- The global Fastify error handler checks `instanceof BusinessError` and maps to the appropriate HTTP status code and response format.

## Consequences
- Consistent error responses across all endpoints.
- Type-safe error handling — IDEs can autocomplete error types.
- Clear separation between business errors and infrastructure errors.
