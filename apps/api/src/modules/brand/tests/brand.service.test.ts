import { describe, expect, it, vi } from 'vitest';
import { BrandService } from '../service/brand.service.js';
import type { IBrandRepository } from '../repositories/brand.repository.js';

const createMockRepository = (): IBrandRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  findAll: vi.fn(),
  softDelete: vi.fn(),
});

describe('BrandService', () => {
  it('should create a brand', async () => {
    const repository = createMockRepository();
    const service = new BrandService(repository);

    repository.findByCode.mockResolvedValue(null);
    repository.create.mockResolvedValue('brand-123');
    repository.findById.mockResolvedValue({
      id: 'brand-123',
      organizationId: 'org-123',
      name: 'Coca Cola',
      code: 'COCA',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      name: 'Coca Cola',
      code: 'COCA',
    });

    expect(result.id).toBe('brand-123');
    expect(result.name).toBe('Coca Cola');
    expect(repository.create).toHaveBeenCalledWith({
      organizationId: 'org-123',
      name: 'Coca Cola',
      code: 'COCA',
    });
  });

  it('should throw error for duplicate code', async () => {
    const repository = createMockRepository();
    const service = new BrandService(repository);

    repository.findByCode.mockResolvedValue({
      id: 'brand-123',
      organizationId: 'org-123',
      name: 'Coca Cola',
      code: 'COCA',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Awaited<ReturnType<IBrandRepository['findByCode']>>);

    await expect(
      service.create({
        organizationId: 'org-123',
        name: 'Coca Cola',
        code: 'COCA',
      }),
    ).rejects.toThrow('Brand code already exists.');
  });
});
