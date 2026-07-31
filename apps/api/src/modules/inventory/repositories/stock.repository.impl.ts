import { PrismaClient, type Prisma } from '@prisma/client';
import type { IStockRepository } from './stock.repository.js';

export class StockRepositoryImpl implements IStockRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async createOrGet(_model: Parameters<IStockRepository['createOrGet']>[0]) {
    const stock = await this._prisma.stock.upsert({
      where: {
        organizationId_warehouseId_productId: {
          organizationId: _model.organizationId,
          warehouseId: _model.warehouseId,
          productId: _model.productId,
        },
      },
      update: {},
      create: {
        organizationId: _model.organizationId,
        warehouseId: _model.warehouseId,
        productId: _model.productId,
      },
      select: { id: true },
    });

    return stock.id;
  }

  async updateQuantity(_stockId: string, _quantity: number, _reservedQuantity: number) {
    await this._prisma.stock.update({
      where: { id: _stockId },
      data: {
        quantity: _quantity,
        reservedQuantity: _reservedQuantity,
      },
    });
  }

  async findById(_id: string, _organizationId: string) {
    const stock = await this._prisma.stock.findFirst({
      where: { id: _id, organizationId: _organizationId },
      select: {
        id: true,
        organizationId: true,
        warehouseId: true,
        productId: true,
        quantity: true,
        reservedQuantity: true,
        updatedAt: true,
      },
    });

    return stock
      ? {
          ...stock,
          quantity: Number(stock.quantity),
          reservedQuantity: Number(stock.reservedQuantity),
        }
      : null;
  }

  async findByWarehouseAndProduct(
    _warehouseId: string,
    _productId: string,
    _organizationId: string,
  ) {
    const stock = await this._prisma.stock.findFirst({
      where: {
        warehouseId: _warehouseId,
        productId: _productId,
        organizationId: _organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        warehouseId: true,
        productId: true,
        quantity: true,
        reservedQuantity: true,
        updatedAt: true,
      },
    });

    return stock
      ? {
          ...stock,
          quantity: Number(stock.quantity),
          reservedQuantity: Number(stock.reservedQuantity),
        }
      : null;
  }

  async findAllByWarehouse(_warehouseId: string, _organizationId: string) {
    const stocks = await this._prisma.stock.findMany({
      where: { warehouseId: _warehouseId, organizationId: _organizationId },
      select: {
        id: true,
        organizationId: true,
        warehouseId: true,
        productId: true,
        quantity: true,
        reservedQuantity: true,
        updatedAt: true,
      },
    });

    return stocks.map((s) => ({
      ...s,
      quantity: Number(s.quantity),
      reservedQuantity: Number(s.reservedQuantity),
    }));
  }
}
