import { describe, expect, it, vi } from 'vitest';
import { WarehouseService } from '../service/warehouse.service.js';
import type { IWarehouseRepository } from '../repositories/warehouse.repository.js';

const createMockRepository = (): IWarehouseRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  findAll: vi.fn(),
  softDelete: vi.fn(),
});

describe('WarehouseService', () => {
  it('should create a warehouse', async () => {
    const repository = createMockRepository();
    const service = new WarehouseService(repository);

    repository.findByCode.mockResolvedValue(null);
    repository.create.mockResolvedValue('warehouse-123');
    repository.findById.mockResolvedValue({
      id: 'warehouse-123',
      organizationId: 'org-123',
      branchId: 'branch-123',
      code: 'WH001',
      name: 'Main Warehouse',
      isDefault: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      branchId: 'branch-123',
      code: 'WH001',
      name: 'Main Warehouse',
    });

    expect(result.id).toBe('warehouse-123');
    expect(result.name).toBe('Main Warehouse');
  });
});
