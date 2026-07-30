import { describe, expect, it, vi } from 'vitest';
import { CategoryService } from '../service/category.service.js';
import type { ICategoryRepository } from '../repositories/category.repository.js';

const createMockRepository = (): ICategoryRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  findAll: vi.fn(),
  softDelete: vi.fn(),
});

describe('CategoryService', () => {
  it('should create a category', async () => {
    const repository = createMockRepository();
    const service = new CategoryService(repository);

    repository.findByCode.mockResolvedValue(null);
    repository.create.mockResolvedValue('cat-123');
    repository.findById.mockResolvedValue({
      id: 'cat-123',
      organizationId: 'org-123',
      name: 'Beverages',
      code: 'BEV',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      name: 'Beverages',
      code: 'BEV',
    });

    expect(result.id).toBe('cat-123');
    expect(result.name).toBe('Beverages');
    expect(repository.create).toHaveBeenCalledWith({
      organizationId: 'org-123',
      name: 'Beverages',
      code: 'BEV',
    });
  });

  it('should throw error for duplicate code', async () => {
    const repository = createMockRepository();
    const service = new CategoryService(repository);

    repository.findByCode.mockResolvedValue({
      id: 'cat-123',
      organizationId: 'org-123',
      name: 'Beverages',
      code: 'BEV',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Awaited<ReturnType<ICategoryRepository['findByCode']>>);

    await expect(
      service.create({
        organizationId: 'org-123',
        name: 'Beverages',
        code: 'BEV',
      }),
    ).rejects.toThrow('Category code already exists.');
  });
});
