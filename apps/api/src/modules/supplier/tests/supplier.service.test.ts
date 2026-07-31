import { describe, expect, it, vi } from 'vitest';
import { SupplierService } from '../service/supplier.service.js';
import type { ISupplierRepository } from '../repositories/supplier.repository.js';

const createMockRepository = (): ISupplierRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  findAll: vi.fn(),
  softDelete: vi.fn(),
});

describe('SupplierService', () => {
  it('should create a supplier', async () => {
    const repository = createMockRepository();
    const service = new SupplierService(repository);

    repository.findByCode.mockResolvedValue(null);
    repository.create.mockResolvedValue('supplier-123');
    repository.findById.mockResolvedValue({
      id: 'supplier-123',
      organizationId: 'org-123',
      code: 'SUP001',
      name: 'Test Supplier',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      code: 'SUP001',
      name: 'Test Supplier',
    });

    expect(result.id).toBe('supplier-123');
    expect(result.name).toBe('Test Supplier');
  });
});
