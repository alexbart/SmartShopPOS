import { describe, expect, it, vi } from 'vitest';
import { StockService } from '../services/stock.service.js';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';

const createMockTx = () => ({
  stock: {
    upsert: vi.fn().mockResolvedValue({ id: 'stock-123' }),
    findFirst: vi.fn().mockResolvedValue({
      id: 'stock-123',
      quantity: 0,
      reservedQuantity: 0,
    }),
    update: vi.fn().mockResolvedValue({}),
  },
  stockMovement: {
    create: vi.fn().mockResolvedValue({ id: 'movement-123' }),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
});

describe('StockService', () => {
  it('should increase stock via increase method', async () => {
    const tx = createMockTx();
    const unitOfWork = {
      execute: vi.fn().mockImplementation(async (cb: (_t: unknown) => Promise<void>) => cb(tx)),
    } as unknown as IUnitOfWork;

    const stockService = new StockService(unitOfWork, {} as never);

    await stockService.increase({
      organizationId: 'org-123',
      warehouseId: 'wh-123',
      productId: 'prod-123',
      quantity: 10,
      type: 'PURCHASE',
    });

    expect(unitOfWork.execute).toHaveBeenCalled();
    expect(tx.stock.upsert).toHaveBeenCalled();
    expect(tx.stockMovement.create).toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('should decrease stock via decrease method', async () => {
    const tx = createMockTx();
    tx.stock.findFirst = vi.fn().mockResolvedValue({
      id: 'stock-123',
      quantity: 100,
      reservedQuantity: 0,
    });
    const unitOfWork = {
      execute: vi.fn().mockImplementation(async (cb: (_t: unknown) => Promise<void>) => cb(tx)),
    } as unknown as IUnitOfWork;

    const stockService = new StockService(unitOfWork, {} as never);

    await stockService.decrease({
      organizationId: 'org-123',
      warehouseId: 'wh-123',
      productId: 'prod-123',
      quantity: 5,
      type: 'SALE',
    });

    expect(unitOfWork.execute).toHaveBeenCalled();
    expect(tx.stockMovement.create).toHaveBeenCalled();
  });
});
