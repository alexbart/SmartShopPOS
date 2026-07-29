# Roles

## Document Information

| Property     | Value                       |
| ------------ | --------------------------- |
| Document     | Roles                       |
| Product      | SmartShopPOS                |
| Version      | 1.0.0                       |
| Status       | Approved                    |
| Owner        | Security & Engineering Team |
| Last Updated | July 2026                   |

---

# 1. Purpose

This document defines the canonical roles for SmartShopPOS, their base permissions, and intended use.

Roles are building blocks. Actual role assignments and permission modifications happen per organization through configuration.

---

# 2. Roles

## Owner

Role Type: System

Description:

Full control over the organization. Cannot be deleted. Cannot have permissions removed.

Base Permissions:

- organizations.*
- users.*
- roles.*
- branches.*
- products.*
- inventory.*
- sales.*
- customers.*
- suppliers.*
- purchases.*
- payments.*
- receipts.*
- reports.*
- settings.*
- sync.*
- shifts.*
- audit.*
- system.*
- approvals.*

Constraints:

- Cannot be reassigned
- At least one Owner must exist
- Owner actions are fully audited

---

## Administrator

Role Type: Business

Description:

Operational management of the organization. Configures settings, manages users, and views all reports.

Base Permissions:

- organizations.read
- organizations.update
- users.*
- roles.read
- roles.create
- roles.update
- branches.*
- products.*
- inventory.*
- sales.*
- sales.refund
- sales.returns.process
- customers.*
- suppliers.*
- purchases.*
- payments.*
- receipts.*
- reports.*
- reports.export
- settings.general.*
- settings.taxes.manage
- settings.printers.manage
- settings.sync.manage
- settings.backups.manage
- settings.licenses.manage
- settings.integrations.manage
- settings.logs.view
- sync.*
- shifts.*
- audits.read
- approvals.*

Excluded:

- system.*
- audit.config.manage

---

## Manager

Role Type: Business

Description:

Day-to-day operations oversight. Approves sensitive actions. Manages staff and operational settings.

Base Permissions:

- branches.read
- branches.update
- products.*
- inventory.*
- inventory.settings.update
- sales.*
- sales.refund
- sales.returns.process
- sales.discounts.apply (up to configured limit)
- sales.receipts.reprint
- sales.receipts.email
- customers.*
- customers.loyalty.manage
- customers.credit.manage
- purchases.*
- payments.*
- receipts.*
- reports.*
- reports.export
- settings.printers.manage
- sync.read
- sync.trigger
- sync.conflicts.resolve
- shifts.*
- shifts.override
- approvals.*

Excluded:

- users.* (except viewing)
- roles.*
- organizations.*
- audit.config.manage
- system.*

---

## Supervisor

Role Type: Business

Description:

Shift-level oversight with limited approval authority.

Base Permissions:

- products.read
- products.create
- products.update
- inventory.read
- inventory.adjust
- sales.*
- sales.refund (requires approval)
- sales.returns.process
- sales.discounts.apply (up to configured limit)
- sales.receipts.reprint
- sales.receipts.email
- customers.read
- customers.create
- customers.update
- purchases.read
- purchases.create
- payments.read
- payments.process
- receipts.*
- reports.*
- reports.export
- sync.read
- sync.trigger
- shifts.*
- approvals.*

Excluded:

- products.delete
- inventory.transfer
- sales.void
- users.*
- roles.*
- settings.*

---

## Cashier

Role Type: Frontline

Description:

Primary point of sale operator. Can sell, accept payments, and serve customers.

Base Permissions:

- products.read
- sales.create
- sales.cancel
- sales.receipts.print
- sales.receipts.email
- customers.read
- customers.create
- payments.process
- receipts.read
- shifts.open
- shifts.close

Excluded:

- sales.refund
- sales.returns
- sales.discounts.apply
- inventory.*
- purchases.*
- reports.*
- settings.*
- approvals.*

---

## Inventory Officer

Role Type: Operations

Description:

Manages stock levels, receives purchases, and performs stock adjustments.

Base Permissions:

- products.read
- inventory.read
- inventory.adjust
- inventory.transfer
- inventory.audit
- inventory.alerts.view
- inventory.counts.manage
- purchases.read
- purchases.create
- purchases.receive
- suppliers.read
- reports.inventory.view

Excluded:

- sales.*
- payments.*
- customers.*
- settings.*
- approvals.*

---

## Accountant

Role Type: Finance

Description:

Reviews financial data, reconciles payments, and generates financial reports.

Base Permissions:

- sales.read
- payments.read
- payments.reconcile
- reports.sales.view
- reports.financial.view
- reports.export
- customers.credit.manage
- shifts.reconcile
- audit.read

Excluded:

- products.*
- inventory.*
- sales.create
- purchases.*
- settings.*

---

## Viewer

Role Type: Read-Only

Description:

Read-only access to designated reports and dashboards. No write operations.

Base Permissions:

- products.read
- inventory.read
- sales.read
- customers.read
- reports.read
- shifts.read
- dashboard.read

Excluded:

- All write permissions
- approvals.*

---

## Auditor

Role Type: Compliance

Description:

Read-only access to audit logs and compliance reports. Cannot modify business data.

Base Permissions:

- audit.read
- audit.export
- reports.read
- compliance.report.generated
- system.health.view

Excluded:

- All write permissions
- approvals.*

---

# 3. Role Extension

Organizations may create custom roles.

Custom roles:

- Start from no permissions
- Receive permissions explicitly assigned
- Never inherit from built-in roles
- Must be reviewed against the Permissions Matrix
- Are subject to the same approval workflows as built-in roles

---

# 4. Role Constraints

- No role may be deleted while users are assigned
- Role deletion requires confirmation and belongs to a documented ADR if it removes system capabilities
- Default roles cannot be modified in a way that removes their core purpose
- Every role change is audited

---

# 5. Cross-References

| Document | Purpose |
|---|---|
| `PRODUCT_CONSTITUTION.md` | Non-negotiable principles |
| `ENGINEERING_PLAYBOOK.md` | Module and RFC requirements |
| `SECURITY_STANDARD.md` | Security requirements and practices |
| `PERMISSIONS.md` | Canonical permission definitions |
| `SECURITY_EVENTS.md` | Canonical security events |
| `docs/02-business/PERMISSIONS_MATRIX.md` | Business permission matrix |
| `docs/02-business/WORKFLOWS.md` | Business process flows |
