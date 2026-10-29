import { describe, expect, it, vi } from 'vitest';
import { ReceiptService } from '../service/receipt.service.js';

describe('ReceiptService', () => {
  it('should create a receipt', async () => {
    const mockPrisma = {
      receipt: {
        findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
          id: 'receipt-123',
          organizationId: 'org-123',
          saleId: 'sale-123',
          number: 'RCPT-260731-000001',
          issuedAt: new Date(),
          createdAt: new Date(),
        }),
        create: vi.fn().mockResolvedValue({ id: 'receipt-123' }),
      },
    };
    const mockUnitOfWork = {
      execute: vi
        .fn()
        .mockImplementation(async (fn: (_tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
    };
    const mockNumberSequence = {
      next: vi.fn().mockResolvedValue('RCPT-260731-000001'),
    };
    const service = new ReceiptService(
      mockUnitOfWork as never,
      mockNumberSequence as never,
      mockPrisma as never,
    );

    const result = await service.create({
      organizationId: 'org-123',
      saleId: 'sale-123',
    });

    expect(result.id).toBe('receipt-123');
    expect(result.number).toBe('RCPT-260731-000001');
  });
});
