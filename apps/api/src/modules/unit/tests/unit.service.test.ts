import { describe, expect, it, vi } from 'vitest';
import { UnitService } from '../service/unit.service.js';
import type { IUnitRepository } from '../repositories/unit.repository.js';

const createMockRepository = (): IUnitRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  findAll: vi.fn(),
  softDelete: vi.fn(),
});

describe('UnitService', () => {
  it('should create a unit', async () => {
    const repository = createMockRepository();
    const service = new UnitService(repository);

    repository.findByCode.mockResolvedValue(null);
    repository.create.mockResolvedValue('unit-123');
    repository.findById.mockResolvedValue({
      id: 'unit-123',
      organizationId: 'org-123',
      name: 'Piece',
      code: 'PCS',
      abbreviation: 'pc',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      name: 'Piece',
      code: 'PCS',
      abbreviation: 'pc',
    });

    expect(result.id).toBe('unit-123');
    expect(result.name).toBe('Piece');
  });
});
