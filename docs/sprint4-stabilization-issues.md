# Pre-existing Issues (Sprint 4 Stabilization)

## Issue 1: auth.repository.test.ts spy assertion mismatch

- **Labels:** bug, tech-debt
- **File:** `src/modules/auth/tests/auth.repository.test.ts`
- **Description:** The test expects `prisma.organization.findFirst` to be called with `select: { id: true, status: true }`, but the implementation also selects `code` and `name`. Update the test spy assertion to match the actual implementation.

## Issue 2: auth login/authz integration failures

- **Labels:** bug
- **Files:** `src/modules/auth/tests/auth.login.integration.test.ts`, `src/modules/auth/tests/auth.authz.integration.test.ts`
- **Description:** Login and authz integration tests return 500. The `login` method was missing session creation (fixed in Sprint 4), but `auth.service.ts:155` returns `RegisterResponse` instead of `LoginResponse`. Also `auth.controller.ts` `refresh` returns `RegisterResponse` type but response shape differs, and `auth.routes.ts` `POST /refresh` returns `RefreshResponse` but controller returns `LoginResponse`.

## Issue 3: health.test.ts missing reflect-metadata

- **Labels:** chore
- **File:** `src/tests/health.test.ts`
- **Description:** The health test doesn't import `reflect-metadata` at the top, causing `tsyringe requires a reflect polyfill` error. Add `import "reflect-metadata"` to line 1.
