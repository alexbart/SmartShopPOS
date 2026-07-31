import { describe, expect, it, vi } from 'vitest';
import { ReceiptService } from '../service/receipt.service.js';

describe('ReceiptService', () => {
  it('should create a receipt', async () => {
    const mockPrisma = {
      receipt: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'receipt-123',
            organizationId: 'org-123',
            saleId: 'sale-123',
            number: 'RCPT-260731-000001',
            issuedAt: new Date(),
            createdAt: new Date(),
          }),
        create: vi.fn().mockResolvedValue({ id: 'receipt-123' }),
      },
    } as unknown as Parameters<ConstructorParameters<typeof ReceiptService>[2]>[0];
    const mockUnitOfWork = {
      execute: vi.fn().mockImplementation(async (fn: (_tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
    } as unknown as ConstructorParameters<typeof ReceiptService>[0];
    const mockNumberSequence = {
      next: vi.fn().mockResolvedValue('RCPT-260731-000001'),
    } as unknown as ConstructorParameters<typeof ReceiptService>[1];
    const service = new ReceiptService(mockUnitOfWork, mockNumberSequence, mockPrisma);

    const result = await service.create({
      organizationId: 'org-123',
      saleId: 'sale-123',
    });

    expect(result.id).toBe('receipt-123');
    expect(result.number).toBe('RCPT-260731-000001');
  });
});
