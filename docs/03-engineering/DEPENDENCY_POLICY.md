# SmartShopPOS Dependency Policy

## Document Information

| Property     | Value             |
| ------------ | ----------------- |
| Document     | Dependency Policy |
| Product      | SmartShopPOS      |
| Version      | 1.0.0             |
| Status       | Approved          |
| Owner        | Engineering Team  |
| Last Updated | July 2026         |

---

# 1. Purpose

This document defines how SmartShopPOS manages external dependencies.

Objectives:

- Maintain application stability
- Reduce security risks
- Prevent dependency chaos
- Ensure compatibility
- Control technical debt

---

# 2. Dependency Philosophy

Every dependency is a liability.

Before adding a package, ask:

1. Do we really need it?
2. Can we implement it ourselves?
3. Is it actively maintained?
4. Does it introduce security risks?
5. Does it fit our architecture?

---

# 3. Approved Runtime

Backend:

Node.js

Language:

TypeScript

Framework:

Fastify

---

# 4. Node.js Version Management

The project must define:

.nvmrc

Example:

```
22.x
```

or

```
24.x LTS
```

---

All developers and CI environments must use the same version.

---

# 5. Package Manager

Standard:

npm

Alternative:

pnpm (requires approval)

---

Lock files are mandatory.

Never commit without:

package-lock.json

---

# 6. Adding Dependencies

New dependencies require:

Purpose

Alternative evaluation

Security review

License check

Maintenance check

Bundle/runtime impact

---

# 7. Dependency Categories

## Production Dependencies

Required during application execution.

Example:

Fastify

Database drivers

Authentication libraries

---

## Development Dependencies

Only required during development.

Example:

Testing tools

Linting tools

Formatting tools

---

# 8. Dependency Approval Rules

High-risk packages require review:

Authentication

Encryption

Payments

File processing

Database libraries

Infrastructure tools

---

# 9. Version Policy

Prefer:

Fixed major versions

Example:

```
fastify: ^5.x
```

Avoid:

```
latest
```

---

# 10. Updates

Dependency updates happen through:

Scheduled maintenance

Security patches

Feature requirements

---

# 11. Update Process

Before updating:

Review changelog

Check breaking changes

Run tests

Build application

Review bundle impact

---

# 12. Security Scanning

Required:

npm audit

Dependency vulnerability scanning

Automated CI checks

---

# 13. Deprecated Packages

Deprecated dependencies must:

Be documented

Have migration plan

Have replacement identified

---

# 14. License Compliance

Allowed:

MIT

Apache 2.0

BSD

ISC

Review required:

GPL

AGPL

Commercial licenses

---

# 15. Package Removal

Before removing:

Check usage

Remove imports

Remove configuration

Update documentation

Run tests

---

# 16. AI Dependency Rules

AI agents may suggest packages.

They may not install packages automatically.

Every dependency addition requires human approval.

---

# 17. Native Modules

Native dependencies require extra review because they may affect:

Deployment

Operating systems

Docker images

Production servers

---

# 18. Database Dependencies

Database libraries must support:

Transactions

Connection pooling

Migrations/versioning

Testing environments

---

# 19. External SDK Policy

External SDKs require:

Official package preference

Version pinning

Sandbox testing

Error handling

Monitoring

---

# 20. Future Dependency Management

Reserved:

Dependabot

Renovate

Software Bill of Materials (SBOM)

Automated license scanning

Supply chain security scanning
