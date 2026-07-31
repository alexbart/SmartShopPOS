# 0006 — Optional Integrations

**Status:** Accepted  
**Date:** 2026-07-29

## Context

The system needs external service integrations (M-Pesa, email, SMS, webhooks) that may not always be available. Integrations should be pluggable—enabled via config without breaking core functionality.

## Decision

All external integrations follow the same pattern:
1. Controlled by a feature flag (e.g., `MPESA_ENABLED=true`)
2. Service class injected only when enabled
3. Graceful degradation when disabled—core flow continues

The `EnvConfig` validates required variables when a feature is enabled and logs warnings when missing. Each integration lives in `src/shared/integrations/` and exposes a common interface.

### Pattern:
```
if (env.MPESA_ENABLED) {
  const mpesaService = new MpesaService(env.MPESA_API_KEY, ...);
  // use for payments
} else {
  // cash-only flow
}
```

### Alternatives considered:
- **Always require all integrations** — rejected; too rigid.
- **Plugin system** — deferred to v2.0 when the module set is larger.

## Consequences

New integrations add a service in `src/shared/integrations/`, an env flag in `env.ts`, and conditional wiring in the relevant module. Core business logic never depends on optional integrations.
