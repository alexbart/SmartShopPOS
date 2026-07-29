# Security Events

## Document Information

| Property     | Value                       |
| ------------ | --------------------------- |
| Document     | Security Events             |
| Product      | SmartShopPOS                |
| Version      | 1.0.0                       |
| Status       | Approved                    |
| Owner        | Security & Engineering Team |
| Last Updated | July 2026                   |

---

# 1. Purpose

This document defines the canonical names for security-related events emitted by SmartShopPOS.

All security events follow the pattern:

`security.<category>.<action>`

This ensures consistent naming across services, modules, and integrations.

---

# 2. Authentication Events

Event Name

Security Context

Description

security.auth.login.success

- Organization ID
- User ID
- Branch ID
- Device ID
- IP address

User authenticated successfully.

security.auth.login.failed

- Organization ID
- User ID or identifier
- Branch ID
- Device ID
- IP address

Login attempt failed.

security.auth.logout

- Organization ID
- User ID
- Branch ID
- Device ID

User logged out.

security.auth.token.refresh

- Organization ID
- User ID
- Device ID

Refresh token used successfully.

security.auth.token.refresh.failed

- Organization ID
- User ID or identifier
- Device ID

Refresh token rejected.

security.auth.password.changed

- Organization ID
- User ID
- Actor User ID

Password changed.

security.auth.password.reset.requested

- Organization ID
- User ID

Password reset requested.

security.auth.mfa.enabled

- Organization ID
- User ID

MFA enabled.

security.auth.mfa.disabled

- Organization ID
- User ID

MFA disabled.

security.auth.mfa.challenge.failed

- Organization ID
- User ID

MFA challenge failed.

security.auth.device.registered

- Organization ID
- User ID
- Device ID

New device registered.

security.auth.device.revoked

- Organization ID
- User ID
- Device ID

Device session revoked.

security.auth.session.expired

- Organization ID
- User ID

Session expired.

security.auth.lockout.triggered

- Organization ID
- User ID

Account locked after repeated failed attempts.

security.auth.lockout.released

- Organization ID
- User ID

Account lockout released.

---

# 3. Authorization Events

Event Name

Security Context

Description

security.authz.permission.denied

- Organization ID
- User ID
- Permission
- Resource
- Action
- Branch ID
- Request ID

Permission check failed.

security.authz.role.changed

- Organization ID
- User ID
- Target User ID
- Previous Role
- New Role
- Actor User ID

User role changed.

security.authz.branch.access.denied

- Organization ID
- User ID
- Requested Branch ID
- Permitted Branch IDs

Cross-branch access blocked.

security.authz.escalation.attempt

- Organization ID
- User ID
- Attempted Permission
- Resource
- Actor User ID

User attempted to access resource beyond role permissions.

---

# 4. Data Protection Events

Event Name

Security Context

Description

security.data.export.requested

- Organization ID
- User ID
- Export Type
- Record Count
- Approval Status

Data export requested.

security.data.export.approved

- Organization ID
- User ID
- Export Type
- Approver User ID

Data export approved.

security.data.export.rejected

- Organization ID
- User ID
- Export Type
- Approver User ID

Data export rejected.

security.data.classification.violation

- Organization ID
- User ID
- Data Classification
- Resource Type
- Action attempted

User attempted action inconsistent with data classification.

security.data.retention.violation

- Organization ID
- Data Type
- Record Identifier

Data exceeded retention policy without deletion.

security.data.tamper.detected

- Organization ID
- Table
- Record ID
- Field
- Expected Value
- Actual Value

Immutable data modified outside approved channel.

---

# 5. Threat Detection Events

Event Name

Security Context

Description

security.threat.sql.injection

- Organization ID
- User ID
- Request ID
- Input Field
- IP address

SQL injection pattern detected.

security.threat.xss.attempt

- Organization ID
- User ID
- Request ID
- Input Field
- IP address

XSS pattern detected.

security.threat.rate.limit.exceeded

- Organization ID
- User ID or anonymous
- Endpoint
- Request ID
- IP address

Rate limit exceeded.

security.threat.brute.force.detected

- Organization ID
- User ID or identifier
- Endpoint
- Request ID
- IP address

Brute force pattern detected.

security.threat.anomalous.access

- Organization ID
- User ID
- Usual Branch IDs
- Accessed Branch IDs
- Time
- IP address

Access pattern outside normal behavior.

security.threat.data.exfiltration

- Organization ID
- User ID
- Export Size
- Destination
- IP address

Large or unusual data export detected.

---

# 6. Compliance Events

Event Name

Security Context

Description

security.compliance.audit.triggered

- Organization ID
- Triggered By
- Scope

Audit triggered.

security.compliance.violation

- Organization ID
- Violation Type
- Regulation
- Resource
- User ID

Compliance violation detected.

security.compliance.report.generated

- Organization ID
- Report Type
- Generated By
- Period Covered

Mandatory compliance report generated.

security.compliance.retention.applied

- Organization ID
- Data Type
- Records Affected

Retention policy applied and legacy data purged.

---

# 7. Configuration Events

Event Name

Security Context

Description

security.config.permission.changed

- Organization ID
- User ID
- Permission
- Resource
- Previous Value
- New Value

Permission configuration changed.

security.config.role.modified

- Organization ID
- User ID
- Role Name
- Change Summary

Role definition modified.

security.config.security.policy.updated

- Organization ID
- User ID
- Policy Name
- Previous Value
- New Value

Security policy updated.

security.config.integration.added

- Organization ID
- User ID
- Integration Type

Integration added.

security.config.integration.removed

- Organization ID
- User ID
- Integration Type

Integration removed.

---

# 8. Cross-References

| Document | Purpose |
|---|---|
| `SECURITY_STANDARD.md` | Security requirements and practices |
| `LOGGING_STANDARD.md` | Logging format and levels |
| `EVENT_NAMES.md` | Canonical event naming conventions |
| `docs/02-business/PERMISSIONS_MATRIX.md` | Permission source of truth |
