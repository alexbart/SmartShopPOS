import { PrismaClient, type Prisma } from '@prisma/client';
import type { IStockMovementRepository } from './stock-movement.repository.js';

export class StockMovementRepositoryImpl implements IStockMovementRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(_model: Parameters<IStockMovementRepository['create']>[0]) {
    const movement = await this._prisma.stockMovement.create({
      data: {
        organizationId: _model.organizationId,
        warehouseId: _model.warehouseId,
        productId: _model.productId,
        stockId: _model.stockId,
        type: _model.type,
        quantity: _model.quantity,
        referenceType: _model.referenceType,
        referenceId: _model.referenceId,
        performedBy: _model.performedBy,
        remarks: _model.remarks,
      },
      select: { id: true },
    });

    return movement.id;
  }

  async findById(_id: string, _organizationId: string) {
    const movement = await this._prisma.stockMovement.findFirst({
      where: { id: _id, organizationId: _organizationId },
      select: {
        id: true,
        organizationId: true,
        warehouseId: true,
        productId: true,
        stockId: true,
        type: true,
        quantity: true,
        referenceType: true,
        referenceId: true,
        performedBy: true,
        remarks: true,
        createdAt: true,
      },
    });

    return movement
      ? {
          ...movement,
          quantity: Number(movement.quantity),
        }
      : null;
  }

  async findAll(_query: Parameters<IStockMovementRepository['findAll']>[0]) {
    const where: Record<string, unknown> = {
      organizationId: _query.organizationId,
    };

    if (_query.warehouseId) where.warehouseId = _query.warehouseId;
    if (_query.productId) where.productId = _query.productId;
    if (_query.type) where.type = _query.type;

    const orderBy: Record<string, unknown> = {};
    if (_query.sortBy) {
      orderBy[_query.sortBy] = _query.sortOrder ?? 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this._prisma.stockMovement.findMany({
        where,
        orderBy,
        skip: (_query.page - 1) * _query.limit,
        take: _query.limit,
        select: {
          id: true,
          organizationId: true,
          warehouseId: true,
          productId: true,
          stockId: true,
          type: true,
          quantity: true,
          referenceType: true,
          referenceId: true,
          performedBy: true,
          remarks: true,
          createdAt: true,
        },
      }),
      this._prisma.stockMovement.count({ where }),
    ]);

    return {
      items: items.map((m) => ({ ...m, quantity: Number(m.quantity) })),
      total,
    };
  }
}
