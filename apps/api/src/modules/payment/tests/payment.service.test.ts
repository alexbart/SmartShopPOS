import { describe, expect, it, vi } from 'vitest';
import { PaymentService } from '../service/payment.service.js';

describe('PaymentService', () => {
  it('should create a payment', async () => {
    const mockPrisma = {
      sale: {
        findFirst: vi.fn().mockResolvedValue({ total: 200 }),
      },
      payment: {
        create: vi.fn().mockResolvedValue({ id: 'payment-123' }),
        findFirst: vi.fn().mockResolvedValue({
          id: 'payment-123',
          organizationId: 'org-123',
          saleId: 'sale-123',
          method: 'CASH',
          amount: 200,
          reference: null,
          status: 'PAID',
          paidAt: new Date(),
          createdAt: new Date(),
        }),
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
      },
    } as unknown as Parameters<ConstructorParameters<typeof PaymentService>[0]>[0];
    const mockUnitOfWork = {
      execute: vi.fn().mockImplementation(async (fn: (_tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
    } as unknown as ConstructorParameters<typeof PaymentService>[0];
    const service = new PaymentService(mockUnitOfWork, mockPrisma);

    const result = await service.create({
      organizationId: 'org-123',
      saleId: 'sale-123',
      method: 'CASH',
      amount: 200,
    });

    expect(result.id).toBe('payment-123');
    expect(result.method).toBe('CASH');
  });
});
