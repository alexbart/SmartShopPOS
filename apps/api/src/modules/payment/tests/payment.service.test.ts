import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PaymentService } from '../service/payment.service.js';
import { ValidationError, NotFoundError, ConflictError } from '../../../shared/errors/business-error.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePaymentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'payment-1',
    organizationId: 'org-a',
    saleId: 'sale-1',
    method: 'CASH',
    amount: 1000,
    reference: null,
    status: 'PAID',
    paidAt: new Date(),
    createdAt: new Date(),
    idempotencyKey: null,
    ...overrides,
  };
}

function makeMocks({
  saleTotal = 1000,
  existingPaid = 0,
  saleOrgId = 'org-a',
  existingByKey = null as ReturnType<typeof makePaymentRecord> | null,
  createId = 'payment-1',
  createdRecord = null as ReturnType<typeof makePaymentRecord> | null,
} = {}) {
  const mockTx = {
    sale: {
      findFirst: vi.fn().mockResolvedValue(
        saleOrgId ? { total: saleTotal } : null,
      ),
    },
    payment: {
      create: vi.fn().mockResolvedValue({ id: createId }),
      findFirst: vi.fn().mockResolvedValue(createdRecord ?? makePaymentRecord({ id: createId })),
      findUnique: vi.fn().mockResolvedValue(existingByKey),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: existingPaid } }),
    },
  };

  const mockUnitOfWork = {
    execute: vi.fn().mockImplementation(async (fn: (_tx: unknown) => Promise<unknown>) => fn(mockTx)),
  };

  const mockEventBus = { publish: vi.fn().mockResolvedValue(undefined) };

  const service = new PaymentService(
    mockUnitOfWork as unknown as ConstructorParameters<typeof PaymentService>[0],
    mockTx as unknown as ConstructorParameters<typeof PaymentService>[1],
    mockEventBus as unknown as ConstructorParameters<typeof PaymentService>[2],
  );

  return { service, mockTx, mockUnitOfWork, mockEventBus };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PaymentService.create', () => {
  // ── Amount validation ──────────────────────────────────────────────────────

  it('rejects zero amount', async () => {
    const { service } = makeMocks();
    await expect(
      service.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 0 }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects negative amount', async () => {
    const { service } = makeMocks();
    await expect(
      service.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: -100 }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects NaN amount', async () => {
    const { service } = makeMocks();
    await expect(
      service.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: NaN }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects Infinity amount', async () => {
    const { service } = makeMocks();
    await expect(
      service.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: Infinity }),
    ).rejects.toThrow(ValidationError);
  });

  // ── Sale existence ─────────────────────────────────────────────────────────

  it('rejects unknown saleId', async () => {
    const { service, mockTx } = makeMocks();
    mockTx.sale.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ organizationId: 'org-a', saleId: 'unknown-sale', method: 'CASH', amount: 100 }),
    ).rejects.toThrow(NotFoundError);
  });

  // ── Organization isolation ─────────────────────────────────────────────────

  it('rejects payment when sale belongs to a different organization', async () => {
    const { service, mockTx } = makeMocks({ saleOrgId: 'org-a' });
    // Sale lookup scoped to org-b returns null (sale belongs to org-a)
    mockTx.sale.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ organizationId: 'org-b', saleId: 'sale-1', method: 'CASH', amount: 100 }),
    ).rejects.toThrow(NotFoundError);
  });

  // ── Valid payments ─────────────────────────────────────────────────────────

  it('records full payment — sale total 1000, payment 1000', async () => {
    const { service } = makeMocks({ saleTotal: 1000, existingPaid: 0 });
    const result = await service.create({
      organizationId: 'org-a',
      saleId: 'sale-1',
      method: 'CASH',
      amount: 1000,
    });
    expect(result.id).toBe('payment-1');
    expect(result.status).toBe('PAID');
  });

  it('records partial payment — sale total 1000, payment 400', async () => {
    const { service } = makeMocks({ saleTotal: 1000, existingPaid: 0 });
    const result = await service.create({
      organizationId: 'org-a',
      saleId: 'sale-1',
      method: 'CASH',
      amount: 400,
    });
    expect(result.id).toBe('payment-1');
  });

  it('records second partial payment — existing 400, new 600, total = 1000', async () => {
    const { service } = makeMocks({ saleTotal: 1000, existingPaid: 400 });
    const result = await service.create({
      organizationId: 'org-a',
      saleId: 'sale-1',
      method: 'CARD',
      amount: 600,
    });
    expect(result.id).toBe('payment-1');
  });

  // ── Overpayment ────────────────────────────────────────────────────────────

  it('rejects overpayment — existing 400, new 700, total would be 1100 > 1000', async () => {
    const { service } = makeMocks({ saleTotal: 1000, existingPaid: 400 });
    await expect(
      service.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 700 }),
    ).rejects.toThrow(ConflictError);
  });

  it('rejects overpayment — single payment 1001 > sale total 1000', async () => {
    const { service } = makeMocks({ saleTotal: 1000, existingPaid: 0 });
    await expect(
      service.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 1001 }),
    ).rejects.toThrow(ConflictError);
  });

  // ── Idempotency ────────────────────────────────────────────────────────────

  it('returns existing payment for duplicate idempotencyKey', async () => {
    const existingPayment = makePaymentRecord({ id: 'payment-existing', idempotencyKey: 'key-abc' });
    const { service, mockTx } = makeMocks({ existingByKey: existingPayment });
    mockTx.payment.findUnique.mockResolvedValue(existingPayment);

    const result = await service.create({
      organizationId: 'org-a',
      saleId: 'sale-1',
      method: 'CASH',
      amount: 1000,
      idempotencyKey: 'key-abc',
    });

    expect(result.id).toBe('payment-existing');
    // Must NOT create a new payment
    expect(mockTx.payment.create).not.toHaveBeenCalled();
  });

  it('handles concurrent duplicate idempotencyKey via DB unique constraint', async () => {
    // Simulate: first lookup returns null (race), then create throws unique constraint error,
    // then re-fetch returns the winner record
    const winnerRecord = makePaymentRecord({ id: 'payment-winner', idempotencyKey: 'key-race' });
    const { service, mockTx } = makeMocks({ saleTotal: 1000, existingPaid: 0 });

    mockTx.payment.findUnique
      .mockResolvedValueOnce(null)       // first lookup: key not found (race window)
      .mockResolvedValueOnce(winnerRecord); // re-fetch after constraint error

    mockTx.payment.create.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`idempotencyKey`)'),
    );

    const result = await service.create({
      organizationId: 'org-a',
      saleId: 'sale-1',
      method: 'CASH',
      amount: 1000,
      idempotencyKey: 'key-race',
    });

    expect(result.id).toBe('payment-winner');
    expect(mockTx.payment.create).toHaveBeenCalledTimes(1);
  });

  // ── Split payments (two separate records) ─────────────────────────────────

  it('records split payment — CASH 400 then CARD 600, total = 1000', async () => {
    // First call: 0 existing, pay 400
    const { service: service1, mockTx: tx1 } = makeMocks({ saleTotal: 1000, existingPaid: 0 });
    tx1.payment.findFirst.mockResolvedValue(makePaymentRecord({ id: 'p1', method: 'CASH', amount: 400 }));
    const r1 = await service1.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 400 });
    expect(r1.id).toBe('p1');

    // Second call: 400 existing, pay 600
    const { service: service2, mockTx: tx2 } = makeMocks({ saleTotal: 1000, existingPaid: 400 });
    tx2.payment.findFirst.mockResolvedValue(makePaymentRecord({ id: 'p2', method: 'CARD', amount: 600 }));
    const r2 = await service2.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CARD', amount: 600 });
    expect(r2.id).toBe('p2');
  });

  // ── Event published ────────────────────────────────────────────────────────

  it('publishes PaymentReceivedEvent after successful payment', async () => {
    const { service, mockEventBus } = makeMocks({ saleTotal: 1000, existingPaid: 0 });
    await service.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 1000 });
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });
});

// ─── findBySaleId ─────────────────────────────────────────────────────────────

describe('PaymentService.findBySaleId', () => {
  it('returns payments scoped to organization', async () => {
    const { service, mockTx } = makeMocks();
    mockTx.payment.findFirst.mockResolvedValue(null); // not used here
    // Override prisma directly for findBySaleId (uses _prisma not tx)
    const mockPrisma = {
      payment: {
        findMany: vi.fn().mockResolvedValue([
          makePaymentRecord({ id: 'p1', organizationId: 'org-a' }),
          makePaymentRecord({ id: 'p2', organizationId: 'org-a' }),
        ]),
      },
    };
    const mockUow = { execute: vi.fn() };
    const mockBus = { publish: vi.fn() };
    const svc = new PaymentService(
      mockUow as unknown as ConstructorParameters<typeof PaymentService>[0],
      mockPrisma as unknown as ConstructorParameters<typeof PaymentService>[1],
      mockBus as unknown as ConstructorParameters<typeof PaymentService>[2],
    );

    const results = await svc.findBySaleId('sale-1', 'org-a');
    expect(results).toHaveLength(2);
    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-a' }),
      }),
    );
  });

  it('does not return payments from a different organization', async () => {
    const mockPrisma = {
      payment: {
        // org-b query returns empty — org-a payments are not visible
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const svc = new PaymentService(
      { execute: vi.fn() } as unknown as ConstructorParameters<typeof PaymentService>[0],
      mockPrisma as unknown as ConstructorParameters<typeof PaymentService>[1],
      { publish: vi.fn() } as unknown as ConstructorParameters<typeof PaymentService>[2],
    );

    const results = await svc.findBySaleId('sale-1', 'org-b');
    expect(results).toHaveLength(0);
  });
});
