# Permissions

## Document Information

| Property     | Value                       |
| ------------ | --------------------------- |
| Document     | Permissions                 |
| Product      | SmartShopPOS                |
| Version      | 1.0.0                       |
| Status       | Approved                    |
| Owner        | Security & Engineering Team |
| Last Updated | July 2026                   |

---

# 1. Purpose

This document defines the canonical permission names for SmartShopPOS.

All permission checks throughout the codebase must use these exact strings.

Format: `resource.action`

---

# 2. Authentication

Permission

Description

auth.read

View own authentication details

auth.update

Update own password or profile

auth.mfa.enable

Enable multi-factor authentication

auth.mfa.disable

Disable multi-factor authentication

auth.device.manage

Manage registered devices

---

# 3. Users

Permission

Description

users.read

View users in organization

users.create

Create new users

users.update

Edit user details

users.delete

Delete or deactivate users

users.invite

Send user invitations

users.roles.assign

Assign roles to users

users.roles.revoke

Revoke roles from users

---

# 4. Organizations

Permission

Description

organizations.read

View organization details

organizations.update

Edit organization settings

organizations.billing.read

View billing and subscription details

organizations.billing.update

Update billing details

organizations.archive

Archive organization

---

# 5. Branches

Permission

Description

branches.read

View branches

branches.create

Create new branches

branches.update

Edit branch details

branches.delete

Delete branches

branches.manage.users

Assign users to branches

---

# 6. Roles

Permission

Description

roles.read

View roles

roles.create

Create new roles

roles.update

Edit roles

roles.delete

Delete roles

roles.permissions.assign

Assign permissions to roles

roles.permissions.revoke

Revoke permissions from roles

---

# 7. Products

Permission

Description

products.read

View products

products.create

Create products

products.update

Edit products

products.delete

Delete products

products.categories.manage

Manage product categories

products.pricing.manage

Manage pricing rules

products.bulk.import

Import products in bulk

products.bulk.export

Export products

products.images.manage

Manage product images

---

# 8. Inventory

Permission

Description

inventory.read

View inventory levels

inventory.adjust

Adjust stock quantities

inventory.transfer

Transfer stock between branches

inventory.audit

View inventory audit history

inventory.alerts.view

View low stock alerts

inventory.counts.manage

Manage stock counts

inventory.settings.update

Update inventory settings (e.g., negative stock)

---

# 9. Sales

Permission

Description

sales.read

View sales

sales.create

Create sales

sales.update

Edit sales before completion

sales.void

Void sales

sales.refund

Process refunds

sales.returns.process

Process returns

sales.discounts.apply

Apply discounts

sales.receipts.reprint

Reprint receipts

sales.receipts.email

Email receipts

sales.cancel

Cancel held sales

---

# 10. Customers

Permission

Description

customers.read

View customers

customers.create

Create customers

customers.update

Edit customer details

customers.delete

Delete customers

customers.loyalty.manage

Manage loyalty programs

customers.credit.manage

Manage customer credit

customers.notes.view

View customer notes

customers.notes.manage

Manage customer notes

---

# 11. Suppliers

Permission

Description

suppliers.read

View suppliers

suppliers.create

Create suppliers

suppliers.update

Edit suppliers

suppliers.delete

Delete suppliers

suppliers.contacts.manage

Manage supplier contacts

suppliers.price-lists.view

View supplier price lists

---

# 12. Purchases

Permission

Description

purchases.read

View purchases

purchases.create

Create purchases

purchases.update

Edit purchases

purchases.approve

Approve purchases

purchases.receive

Receive purchase items

purchases.cancel

Cancel purchases

purchases.returns.process

Process purchase returns

---

# 13. Payments

Permission

Description

payments.read

View payments

payments.process

Process payments

payments.refund

Process refunds

payments.reconcile

Reconcile payments

payments.chargebacks.view

View chargebacks

payments.settings.manage

Manage payment settings

---

# 14. Receipts

Permission

Description

receipts.read

View receipts

receipts.print

Print receipts

receipts.email

Email receipts

receipts.void

Void receipts

receipts.reprint

Reprint receipts

---

# 15. Reports

Permission

Description

reports.read

View reports

reports.sales.view

View sales reports

reports.inventory.view

View inventory reports

reports.financial.view

View financial reports

reports.export

Export reports

reports.schedule.create

Schedule automated reports

reports.schedule.manage

Manage scheduled reports

---

# 16. Settings

Permission

Description

settings.general.read

View general settings

settings.general.update

Update general settings

settings.taxes.manage

Manage tax settings

settings.printers.manage

Manage printer configurations

settings.sync.manage

Manage sync settings

settings.backups.manage

Manage backup configurations

settings.licenses.manage

Manage licenses

settings.integrations.manage

Manage integrations

settings.logs.view

View system logs

---

# 17. Sync

Permission

Description

sync.read

View sync status

sync.trigger

Trigger manual sync

sync.conflicts.resolve

Resolve sync conflicts

sync.config.manage

Manage sync configurations

sync.errors.view

View sync errors

---

# 18. Shifts

Permission

Description

shifts.read

View shifts

shifts.open

Open shifts

shifts.close

Close shifts

shifts.reconcile

Reconcile shifts

shifts.override

Override shift totals (manager approval required)

---

# 19. Audit

Permission

Description

audit.read

View audit logs

audit.export

Export audit logs

audit.config.manage

Configure audit settings

---

# 20. System

Permission

Description

system.health.view

View system health

system.maintenance.view

View maintenance status

system.maintenance.manage

Perform maintenance operations

system.updates.manage

Manage system updates

---

# 21. Approval Workflows

Permission

Description

approvals.request

Request approval for sensitive action

approvals.approve

Approve pending actions

approvals.reject

Reject pending actions

approvals.read

View pending approvals

---

# 22. Principle

Permissions are additive. A role with multiple permissions gains the union of all assigned permissions.

No permission is implied by another permission.

---

# 23. Cross-References

| Document | Purpose |
|---|---|
| `PRODUCT_CONSTITUTION.md` | Non-negotiable principles |
| `ENGINEERING_PLAYBOOK.md` | Module and RFC requirements |
| `SECURITY_STANDARD.md` | Security requirements and practices |
| `ROLES.md` | Canonical role definitions |
| `SECURITY_EVENTS.md` | Canonical security events |
| `docs/02-business/PERMISSIONS_MATRIX.md` | Business permission matrix |
