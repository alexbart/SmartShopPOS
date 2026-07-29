# Data Classification

## Document Information

| Property     | Value                       |
| ------------ | --------------------------- |
| Document     | Data Classification         |
| Product      | SmartShopPOS                |
| Version      | 1.0.0                       |
| Status       | Approved                    |
| Owner        | Security & Engineering Team |
| Last Updated | July 2026                   |

---

# 1. Purpose

This document classifies data stored and processed by SmartShopPOS.

Classification drives protection requirements, access controls, retention policies, and incident response.

---

# 2. Classification Levels

## Public

Data intended for public consumption.

Characteristics:

- No confidentiality impact if disclosed
- No authorization required to view
- May be cached by browsers or CDNs

Examples:

- Product names
- Marketing content
- Public help documentation
- Changelog entries
- Public API documentation

Protection Requirements:

- No encryption at rest required
- No special access controls
- Standard logging applies

---

## Internal

Business data with limited external exposure.

Characteristics:

- Disclosure harms operational efficiency
- Access is restricted to authenticated users
- Accidental disclosure is recoverable

Examples:

- Inventory levels
- Sales reports
- Employee schedules
- Internal system metrics
- Branch operating hours

Protection Requirements:

- Encryption at rest required
- Access restricted to organization members
- Audit logging of access
- Retention policy enforced

---

## Confidential

Sensitive business and customer data.

Characteristics:

- Disclosure causes reputational or financial harm
- Access requires specific authorization
- Disclosure may violate regulations

Examples:

- Customer names and contact details
- Transaction history
- Payment method references (non-sensitive tokens)
- Supplier agreements
- Product cost margins
- Business forecasts

Protection Requirements:

- Encryption at rest required
- Access restricted to authorized roles
- Detailed audit logging required
- Data minimization enforced
- Retention policy enforced
- Export restricted and approved

---

## Restricted

Highly sensitive data whose disclosure causes severe harm.

Characteristics:

- Disclosure causes regulatory, legal, or material financial harm
- Access requires senior authorization
- Disclosure is an emergency incident

Examples:

- Payment credentials
- API secrets and keys
- Encryption keys
- JWT signing secrets
- Fiscal device credentials
- KRA eTIMS credentials
- M-Pesa merchant keys
- Paystack secret keys
- User passwords and password reset tokens

Protection Requirements:

- Encryption at rest required
- Access restricted to named individuals or service accounts
- Immutable audit trail required
- Access requires dual approval where feasible
- Export prohibited outside approved channels
- Automatic rotation enforced
- Breach notification required within defined SLA

---

# 3. Data Handling Rules

## Storage

- Public data: standard storage
- Internal data: encrypted volumes
- Confidential data: encrypted volumes with access control
- Restricted data: encrypted volumes with strict access control and audit

## Transmission

- All data transmitted over TLS (minimum TLS 1.2)
- Public data may use HTTP only for explicitly documented public endpoints
- No sensitive data in query parameters
- No secrets in URLs

## Logging

- Public data: may appear in logs
- Internal data: may appear in logs for authenticated users only
- Confidential data: masked in logs
- Restricted data: never logged

## Backup

- All data included in backups
- Backups encrypted with organization keys
- Backup access restricted to authorized personnel

## Disposal

- Data deleted via approved retention policy
- Secure deletion for encrypted data
- Deletion verified and audited

---

# 4. Classification Assignment

Data owners classify their data during module design.

Classification is reviewed:

- During architecture review for new modules
- During ADR review for data model changes
- Periodically by security team

---

# 5. Kenyan Market Obligations

SmartShopPOS handles data that may include:

- Customer personal information under Kenya Data Protection Act
- Tax and fiscal records under KRA requirements
- Payment instrument data under payment provider regulations

Classifications and controls align with these obligations.

Legal counsel must review any data classification that touches regulated data.

---

# 6. Cross-References

| Document | Purpose |
|---|---|
| `SECURITY_STANDARD.md` | Security requirements and practices |
| `SECURITY_EVENTS.md` | Canonical security events |
| `docs/02-business/DOMAIN_DICTIONARY.md` | Business terminology |
| `docs/02-business/TAX_RULES.md` | Tax data rules |
| `docs/04-database/SCHEMA.md` | Data model |
| `docs/04-database/SEEDING.md` | Test data rules |
