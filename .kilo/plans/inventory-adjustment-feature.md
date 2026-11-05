# Inventory Adjustment Feature — Implementation Plan

## Goal

Add stock adjustment capability to ProductWizard edit mode while reusing existing `StockService.adjust()` for accounting/audit integrity. Keep product master data (PUT /products/:id) separate from inventory movements (POST /inventory/adjust).

---

## Current State (Verified)

**Backend stock engine exists:**

- `StockService.adjust()` — atomic delta + StockMovement + AuditLog
- `POST /inventory/adjust` → `GoodsReceivingController.adjustStock()` → `StockService.adjust()`
- DTO/Schema: `ReceiveGoodsDto` / `receiveGoodsSchema` (for receiving, not adjustments)
- Routes: `/inventory/adjust` exists and calls the correct service
- Warehouse-specific stock (product + warehouse = stock record)

**Missing:**

- No inventory permissions in seed (`inventory:read`, `inventory:adjust`, `inventory:transfer`)
- `adjustStock` controller uses loose body typing, no dedicated DTO/schema
- `remarks` optional in backend but should be mandatory for adjustments
- ProductWizard edit shows `stockQuantity` as editable field (should be read-only)
- No adjustment dialog in frontend

---

## Permission Matrix (New)

| Role      | inventory:read | inventory:adjust | inventory:transfer |
| --------- | -------------- | ---------------- | ------------------ |
| OWNER     | ✓              | ✓                | ✓                  |
| MANAGER   | ✓              | ✓                | ✓                  |
| INVENTORY | ✓              | ✓                | ✓                  |
| CASHIER   | ✓              | —                | —                  |

**Rule:** API enforces permissions; frontend visibility is UX only.

---

## Implementation Checkpoints

### Checkpoint 1 — Inventory Authorization

**Files:**

- `apps/api/prisma/seed.ts` — add permissions + role assignments
- `apps/api/src/modules/inventory/routes/inventory.routes.ts` — verify `authenticateHook` applies
- `apps/api/src/modules/auth/middleware/auth.middleware.ts` — verify `createAuthorizeHook` works for new perms

**Tasks:**

1. Add permissions to seed: `inventory:read`, `inventory:adjust`, `inventory:transfer`
2. Assign to roles per matrix above
3. Verify `/inventory/adjust` requires `inventory:adjust` (add authorize hook if missing)
4. Run seed, test 403 for CASHIER, 200 for MANAGER/INVENTORY/OWNER

---

### Checkpoint 2 — Adjustment Contract

**Files:**

- `apps/api/src/modules/inventory/dto/adjust-stock.dto.ts` (new)
- `apps/api/src/modules/inventory/schemas/adjust-stock.schema.ts` (new)
- `apps/api/src/modules/inventory/controllers/goods-receiving.controller.ts` — update `adjustStock` to use new DTO
- Tests

**DTO/Schema:**

```ts
// adjust-stock.dto.ts
export interface AdjustStockDto {
  warehouseId: string;
  productId: string;
  quantity: number; // delta (non-zero, can be negative)
  type: 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED';
  remarks: string; // mandatory, 3-500 chars
}

// adjust-stock.schema.ts
export const adjustStockSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z
    .number()
    .int()
    .refine((v) => v !== 0, 'Adjustment quantity cannot be zero'),
  type: z.enum(['ADJUSTMENT', 'DAMAGE', 'EXPIRED']),
  remarks: z.string().trim().min(3).max(500),
});
```

**Controller change:** destructure validated body, pass to `StockService.adjust()`.

**Validation tests:**

- Positive/negative delta ✓
- Zero quantity → 400
- Missing remarks → 400
- Remarks < 3 chars → 400
- Remarks > 500 chars → 400
- Invalid type → 400
- CASHIER without perm → 403

---

### Checkpoint 3 — ProductWizard Integration

**Files:**

- `apps/web/src/modules/catalog/ProductWizard.vue`
- `apps/web/src/modules/catalog/components/AdjustStockDialog.vue` (new)
- `apps/web/src/modules/catalog/composables/useInventory.ts` (new)

**Behavior changes:**

| Mode   | Stock Field                                     | Adjust Button                    |
| ------ | ----------------------------------------------- | -------------------------------- |
| Create | `stockQuantity` editable + `warehouseId` select | —                                |
| Edit   | Read-only "Current Stock: X units"              | Shows if `inventory:adjust` perm |

**Adjustment Dialog:**

```
Current Stock: 50 units
Warehouse: [Main Store ▼]     (auto-select if single warehouse)

Adjustment: [ -5 ]  (number input, non-zero)

New Stock: 45 units          (computed preview)

Type: [ DAMAGE ▼ ]           (ADJUSTMENT | DAMAGE | EXPIRED)

Remarks: [ 5 bottles damaged during handling ]  (required, min 3 chars)

[Cancel] [Adjust Stock]
```

**API call:**

```ts
await apiClient.post('/inventory/adjust', {
  warehouseId: selectedWarehouseId,
  productId: route.params.id,
  quantity: delta,
  type: selectedType,
  remarks: remarksInput,
});
```

**Post-success:**

- Toast success
- Invalidate `['product', id]` query → refreshes `stockQuantity` in ProductWizard
- Close dialog

---

### Checkpoint 4 — Accountability UX

**Files:**

- `apps/web/src/modules/catalog/pages/ProductDetailPage.vue` — add "Adjustment History" tab or link
- `apps/web/src/modules/catalog/composables/useInventory.ts` — add `listMovements(productId, warehouseId)`

**Features:**

- Show recent stock movements for this product (from GET /inventory/movements?productId=...)
- Link from ProductWizard "Current Stock" to movements view
- Audit trail already captured in backend (oldValues/newValues in AuditLog)

---

## Data Flow (Edit Mode)

```
User opens /products/:id/edit
    ↓
ProductWizard loads product (GET /products/:id) → includes stockQuantity
    ↓
User sees "Current Stock: 450 units" (read-only)
    ↓
User clicks "Adjust Stock" (visible if inventory:adjust perm)
    ↓
AdjustStockDialog opens
    ↓
Load warehouses (GET /warehouses) → pre-select default/only warehouse
    ↓
User enters delta, type, remarks → clicks "Adjust Stock"
    ↓
POST /inventory/adjust { warehouseId, productId, quantity: delta, type, remarks }
    ↓
Backend: authorize → StockService.adjust() → StockMovement + atomic update + AuditLog
    ↓
201 Created
    ↓
Frontend: invalidate product query → stockQuantity updates → toast
```

---

## Edge Cases & Failure Modes

| Scenario                              | Handling                                                   |
| ------------------------------------- | ---------------------------------------------------------- |
| Multiple warehouses                   | Dialog shows warehouse select; default to primary/first    |
| Insufficient stock for negative delta | Backend throws `InsufficientStockError` → 400 with message |
| Concurrent adjustments                | UnitOfWork + DB transaction serializes                     |
| Network error during adjust           | Toast error; dialog stays open; no partial state           |
| User cancels dialog                   | No API call; form resets                                   |
| Zero delta submitted                  | Schema rejects (client + server)                           |
| Remarks < 3 chars                     | Schema rejects                                             |
| CASHIER tries adjust                  | 403; button hidden but API also blocks                     |

---

## Files to Create/Modify

| Checkpoint | Create                                                      | Modify                                     |
| ---------- | ----------------------------------------------------------- | ------------------------------------------ |
| 1          | —                                                           | `prisma/seed.ts`, `inventory.routes.ts`    |
| 2          | `dto/adjust-stock.dto.ts`, `schemas/adjust-stock.schema.ts` | `goods-receiving.controller.ts`            |
| 3          | `AdjustStockDialog.vue`, `useInventory.ts`                  | `ProductWizard.vue`                        |
| 4          | —                                                           | `ProductDetailPage.vue`, `useInventory.ts` |

---

## Validation Plan

1. **Seed & perms:** Login as each role → verify 403/200 on `/inventory/adjust`
2. **Schema:** Unit tests for `adjustStockSchema` (valid/invalid inputs)
3. **Controller:** Integration test for `adjustStock` with valid/invalid bodies
4. **Frontend:** Manual test edit mode → adjustment dialog → verify stock refresh
5. **Audit:** Verify `StockMovement` + `AuditLog` records created with correct old/new values

---

## Out of Scope

- Transfer workflow (separate feature)
- Cycle count workflow
- Low-stock alerts/auto-reorder
- Mobile/scanner adjustment entry

---

## Rollout Order

1. Checkpoint 1 → commit
2. Checkpoint 2 → commit
3. Checkpoint 3 → commit
4. Checkpoint 4 → commit

Each checkpoint independently testable and revertible.
