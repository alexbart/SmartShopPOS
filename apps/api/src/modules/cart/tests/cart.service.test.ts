import { describe, expect, it, vi, type MockInstance } from 'vitest';
import { CartService } from '../service/cart.service.js';
import type { ICartRepository } from '../repositories/cart.repository.js';

type MockedRepository = {
  [K in keyof ICartRepository]: MockInstance;
};

const createMockRepository = (): ICartRepository & MockedRepository =>
  ({
    create: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    findById: vi.fn(),
    findActiveByWarehouse: vi.fn(),
    clearItems: vi.fn(),
  }) as unknown as ICartRepository & MockedRepository;

describe('CartService', () => {
  it('should create a cart', async () => {
    const repository = createMockRepository();
    const service = new CartService(repository);

    repository.create.mockResolvedValue('cart-123');
    repository.findById.mockResolvedValue({
      id: 'cart-123',
      organizationId: 'org-123',
      warehouseId: 'wh-123',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      warehouseId: 'wh-123',
    });

    expect(result.id).toBe('cart-123');
    expect(result.warehouseId).toBe('wh-123');
  });
});
