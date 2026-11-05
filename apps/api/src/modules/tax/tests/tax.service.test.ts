import { describe, expect, it, vi, type MockInstance } from 'vitest';
import { TaxService } from '../service/tax.service.js';
import type { ITaxRepository } from '../repositories/tax.repository.js';

type MockedRepository = {
  [K in keyof ITaxRepository]: MockInstance;
};

const createMockRepository = (): ITaxRepository & MockedRepository =>
  ({
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    findAll: vi.fn(),
    softDelete: vi.fn(),
  }) as unknown as ITaxRepository & MockedRepository;

describe('TaxService', () => {
  it('should create a tax', async () => {
    const repository = createMockRepository();
    const service = new TaxService(repository);

    repository.findByCode.mockResolvedValue(null);
    repository.create.mockResolvedValue('tax-123');
    repository.findById.mockResolvedValue({
      id: 'tax-123',
      organizationId: 'org-123',
      name: 'VAT18',
      code: 'VAT18',
      rate: 18,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      name: 'VAT18',
      code: 'VAT18',
      rate: 18,
    });

    expect(result.id).toBe('tax-123');
    expect(result.name).toBe('VAT18');
  });
});
