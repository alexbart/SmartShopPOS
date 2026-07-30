import { describe, expect, it, vi } from 'vitest';
import { ProductService } from '../service/product.service.js';
import type { IProductRepository } from '../repositories/product.repository.js';

const createMockRepository = (): IProductRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  findBySku: vi.fn(),
  findAll: vi.fn(),
  softDelete: vi.fn(),
});

describe('ProductService', () => {
  it('should create a product', async () => {
    const repository = createMockRepository();
    const service = new ProductService(repository);

    repository.findByCode.mockResolvedValue(null);
    repository.findBySku.mockResolvedValue(null);
    repository.create.mockResolvedValue('product-123');
    repository.findById.mockResolvedValue({
      id: 'product-123',
      organizationId: 'org-123',
      name: 'Test Product',
      code: 'TP001',
      unitId: 'unit-123',
      costPrice: 10,
      sellingPrice: 20,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      name: 'Test Product',
      code: 'TP001',
      unitId: 'unit-123',
      costPrice: 10,
      sellingPrice: 20,
    });

    expect(result.id).toBe('product-123');
    expect(result.name).toBe('Test Product');
  });
});
