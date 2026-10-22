import { describe, expect, it, vi } from 'vitest';
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
    darajaRequestId: null,
    darajaTransactionId: null,
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
  hasPendingMpesa = false,
} = {}) {
  const mockTx = {
    sale: {
      findFirst: vi.fn().mockResolvedValue(
        saleOrgId ? { total: saleTotal, number: 'INV-000001' } : null,
      ),
    },
    payment: {
      create: vi.fn().mockResolvedValue({ id: createId }),
      findFirst: vi.fn().mockResolvedValue(createdRecord ?? makePaymentRecord({ id: createId })),
      findUnique: vi.fn().mockResolvedValue(existingByKey),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: existingPaid } }),
      count: vi.fn().mockResolvedValue(hasPendingMpesa ? 1 : 0),
      update: vi.fn().mockResolvedValue({}),
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

// ─── PaymentService.create ────────────────────────────────────────────────────

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
    mockTx.sale.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ organizationId: 'org-b', saleId: 'sale-1', method: 'CASH', amount: 100 }),
    ).rejects.toThrow(NotFoundError);
  });

  // ── Valid payments ─────────────────────────────────────────────────────────

  it('records full payment — sale total 1000, payment 1000', async () => {
    const { service } = makeMocks({ saleTotal: 1000, existingPaid: 0 });
    const result = await service.create({
      organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 1000,
    });
    expect(result.id).toBe('payment-1');
    expect(result.status).toBe('PAID');
  });

  it('records partial payment — sale total 1000, payment 400', async () => {
    const { service } = makeMocks({ saleTotal: 1000, existingPaid: 0 });
    const result = await service.create({
      organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 400,
    });
    expect(result.id).toBe('payment-1');
  });

  it('records second partial payment — existing 400, new 600, total = 1000', async () => {
    const { service } = makeMocks({ saleTotal: 1000, existingPaid: 400 });
    const result = await service.create({
      organizationId: 'org-a', saleId: 'sale-1', method: 'CARD', amount: 600,
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
      organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 1000,
      idempotencyKey: 'key-abc',
    });

    expect(result.id).toBe('payment-existing');
    expect(mockTx.payment.create).not.toHaveBeenCalled();
  });

  it('handles concurrent duplicate idempotencyKey via DB unique constraint', async () => {
    const winnerRecord = makePaymentRecord({ id: 'payment-winner', idempotencyKey: 'key-race' });
    const { service, mockTx } = makeMocks({ saleTotal: 1000, existingPaid: 0 });

    mockTx.payment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winnerRecord);

    mockTx.payment.create.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`idempotencyKey`)'),
    );

    const result = await service.create({
      organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 1000,
      idempotencyKey: 'key-race',
    });

    expect(result.id).toBe('payment-winner');
    expect(mockTx.payment.create).toHaveBeenCalledTimes(1);
  });

  // ── Split payments ─────────────────────────────────────────────────────────

  it('records split payment — CASH 400 then CARD 600, total = 1000', async () => {
    const { service: service1, mockTx: tx1 } = makeMocks({ saleTotal: 1000, existingPaid: 0 });
    tx1.payment.findFirst.mockResolvedValue(makePaymentRecord({ id: 'p1', method: 'CASH', amount: 400 }));
    const r1 = await service1.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'CASH', amount: 400 });
    expect(r1.id).toBe('p1');

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

// ─── PaymentService.create — MPESA ───────────────────────────────────────────

describe('PaymentService.create — MPESA', () => {
  it('rejects MPESA payment when phone is missing', async () => {
    const { service } = makeMocks();
    await expect(
      service.create({ organizationId: 'org-a', saleId: 'sale-1', method: 'MPESA', amount: 500 }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects MPESA when a PENDING M-Pesa payment already exists for the sale', async () => {
    const { service } = makeMocks({ hasPendingMpesa: true });
    await expect(
      service.create({
        organizationId: 'org-a', saleId: 'sale-1', method: 'MPESA', amount: 500,
        phone: '0712345678',
      }),
    ).rejects.toThrow(ConflictError);
  });
});

// ─── PaymentService.findBySaleId ──────────────────────────────────────────────

describe('PaymentService.findBySaleId', () => {
  it('returns payments scoped to organization', async () => {
    const mockPrisma = {
      payment: {
        findMany: vi.fn().mockResolvedValue([
          makePaymentRecord({ id: 'p1', organizationId: 'org-a' }),
          makePaymentRecord({ id: 'p2', organizationId: 'org-a' }),
        ]),
      },
    };
    const svc = new PaymentService(
      { execute: vi.fn() } as unknown as ConstructorParameters<typeof PaymentService>[0],
      mockPrisma as unknown as ConstructorParameters<typeof PaymentService>[1],
      { publish: vi.fn() } as unknown as ConstructorParameters<typeof PaymentService>[2],
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
      payment: { findMany: vi.fn().mockResolvedValue([]) },
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

// ─── PaymentService.confirmMpesaPayment ──────────────────────────────────────

describe('PaymentService.confirmMpesaPayment', () => {
  function makeCallbackMocks(paymentRecord: ReturnType<typeof makePaymentRecord> | null) {
    const mockPrisma = {
      payment: {
        findUnique: vi.fn().mockResolvedValue(paymentRecord),
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const mockBus = { publish: vi.fn().mockResolvedValue(undefined) };
    const svc = new PaymentService(
      { execute: vi.fn() } as unknown as ConstructorParameters<typeof PaymentService>[0],
      mockPrisma as unknown as ConstructorParameters<typeof PaymentService>[1],
      mockBus as unknown as ConstructorParameters<typeof PaymentService>[2],
    );
    return { svc, mockPrisma, mockBus };
  }

  it('transitions PENDING → PAID and stores MpesaReceiptNumber', async () => {
    const pending = makePaymentRecord({
      status: 'PENDING', method: 'MPESA',
      darajaRequestId: 'ws_CO_123', darajaTransactionId: null,
    });
    const { svc, mockPrisma, mockBus } = makeCallbackMocks(pending);

    await svc.confirmMpesaPayment('ws_CO_123', 'QHJ7LK9XYZ');

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID', darajaTransactionId: 'QHJ7LK9XYZ' }),
      }),
    );
    expect(mockBus.publish).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — does nothing if payment is already PAID', async () => {
    const paid = makePaymentRecord({ status: 'PAID', darajaRequestId: 'ws_CO_123' });
    const { svc, mockPrisma } = makeCallbackMocks(paid);

    await svc.confirmMpesaPayment('ws_CO_123', 'QHJ7LK9XYZ');

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('ignores unknown CheckoutRequestID', async () => {
    const { svc, mockPrisma } = makeCallbackMocks(null);

    await svc.confirmMpesaPayment('unknown-id', 'QHJ7LK9XYZ');

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('does not re-confirm a FAILED payment (late success callback)', async () => {
    const failed = makePaymentRecord({ status: 'FAILED', darajaRequestId: 'ws_CO_123' });
    const { svc, mockPrisma } = makeCallbackMocks(failed);

    await svc.confirmMpesaPayment('ws_CO_123', 'QHJ7LK9XYZ');

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });
});

// ─── PaymentService.failMpesaPayment ─────────────────────────────────────────

describe('PaymentService.failMpesaPayment', () => {
  function makeFailMocks(paymentRecord: ReturnType<typeof makePaymentRecord> | null) {
    const mockPrisma = {
      payment: {
        findUnique: vi.fn().mockResolvedValue(paymentRecord),
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const svc = new PaymentService(
      { execute: vi.fn() } as unknown as ConstructorParameters<typeof PaymentService>[0],
      mockPrisma as unknown as ConstructorParameters<typeof PaymentService>[1],
      { publish: vi.fn() } as unknown as ConstructorParameters<typeof PaymentService>[2],
    );
    return { svc, mockPrisma };
  }

  it('transitions PENDING → FAILED on cancelled STK', async () => {
    const pending = makePaymentRecord({ status: 'PENDING', darajaRequestId: 'ws_CO_456' });
    const { svc, mockPrisma } = makeFailMocks(pending);

    await svc.failMpesaPayment('ws_CO_456', 'Request cancelled by user');

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
  });

  it('is idempotent — does nothing if already FAILED', async () => {
    const failed = makePaymentRecord({ status: 'FAILED', darajaRequestId: 'ws_CO_456' });
    const { svc, mockPrisma } = makeFailMocks(failed);

    await svc.failMpesaPayment('ws_CO_456');

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('is idempotent — does nothing if already PAID (duplicate failure callback)', async () => {
    const paid = makePaymentRecord({ status: 'PAID', darajaRequestId: 'ws_CO_456' });
    const { svc, mockPrisma } = makeFailMocks(paid);

    await svc.failMpesaPayment('ws_CO_456');

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('ignores unknown CheckoutRequestID', async () => {
    const { svc, mockPrisma } = makeFailMocks(null);

    await svc.failMpesaPayment('unknown-id');

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });
});
