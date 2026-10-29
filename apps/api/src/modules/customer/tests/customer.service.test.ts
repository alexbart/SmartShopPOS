import { describe, expect, it, vi, type MockInstance } from 'vitest';
import { CustomerService } from '../service/customer.service.js';
import type { ICustomerRepository } from '../repositories/customer.repository.js';

type MockedRepository = {
  [K in keyof ICustomerRepository]: MockInstance;
};

const createMockRepository = (): ICustomerRepository & MockedRepository =>
  ({
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    findAll: vi.fn(),
    softDelete: vi.fn(),
  }) as unknown as ICustomerRepository & MockedRepository;

describe('CustomerService', () => {
  it('should create a customer', async () => {
    const repository = createMockRepository();
    const service = new CustomerService(repository);

    repository.findByCode.mockResolvedValue(null);
    repository.create.mockResolvedValue('customer-123');
    repository.findById.mockResolvedValue({
      id: 'customer-123',
      organizationId: 'org-123',
      code: 'CUST001',
      name: 'John Doe',
      loyaltyPoints: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      organizationId: 'org-123',
      code: 'CUST001',
      name: 'John Doe',
    });

    expect(result.id).toBe('customer-123');
    expect(result.name).toBe('John Doe');
  });
});
