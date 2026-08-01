import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { ISaleRepository } from './sale.repository.js';

export class SaleRepositoryImpl implements ISaleRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(_model: Parameters<ISaleRepository['create']>[0]) {
    const sale = await this._prisma.sale.create({
      data: {
        organizationId: _model.organizationId,
        number: _model.number,
        warehouseId: _model.warehouseId,
        cashierId: _model.cashierId,
        customerId: _model.customerId,
        subtotal: _model.subtotal,
        discount: _model.discount,
        tax: _model.tax,
        total: _model.total,
        status: _model.status as 'PENDING' | 'COMPLETED' | 'VOIDED' | 'REFUNDED',
      },
      select: { id: true },
    });

    return sale.id;
  }

  async createItems(_saleId: string, _items: Parameters<ISaleRepository['createItems']>[1]) {
    const data = _items.map((item) => ({
      saleId: _saleId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      tax: item.tax,
      subtotal: item.subtotal,
    }));

    await this._prisma.saleItem.createMany({
      data,
    });
  }

  async list(_organizationId: string, _page = 1, _limit = 20) {
    const skip = (_page - 1) * _limit;
    const [sales, total] = await Promise.all([
      this._prisma.sale.findMany({
        where: { organizationId: _organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: _limit,
      }),
      this._prisma.sale.count({ where: { organizationId: _organizationId } }),
    ]);

    return {
      items: sales.map((sale) => ({
        id: sale.id,
        organizationId: sale.organizationId,
        number: sale.number,
        customerId: sale.customerId ?? undefined,
        warehouseId: sale.warehouseId,
        cashierId: sale.cashierId,
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        tax: Number(sale.tax),
        total: Number(sale.total),
        status: sale.status,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      })),
      total,
      page: _page,
      limit: _limit,
    };
  }

  async findById(_id: string, _organizationId: string) {
    const sale = await this._prisma.sale.findFirst({
      where: { id: _id, organizationId: _organizationId },
      include: {
        items: {
          select: {
            id: true,
            saleId: true,
            productId: true,
            quantity: true,
            price: true,
            discount: true,
            tax: true,
            subtotal: true,
          },
        },
      },
    });

    if (!sale) return null;

    return {
      id: sale.id,
      organizationId: sale.organizationId,
      number: sale.number,
      customerId: sale.customerId ?? undefined,
      warehouseId: sale.warehouseId,
      cashierId: sale.cashierId,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      total: Number(sale.total),
      status: sale.status,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: sale.items.map((item) => ({
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount),
        tax: Number(item.tax),
        subtotal: Number(item.subtotal),
      })),
    };
  }

  async findByNumber(_number: string, _organizationId: string) {
    const sale = await this._prisma.sale.findFirst({
      where: { number: _number, organizationId: _organizationId },
      include: {
        items: {
          select: {
            id: true,
            saleId: true,
            productId: true,
            quantity: true,
            price: true,
            discount: true,
            tax: true,
            subtotal: true,
          },
        },
      },
    });

    if (!sale) return null;

    return {
      id: sale.id,
      organizationId: sale.organizationId,
      number: sale.number,
      customerId: sale.customerId ?? undefined,
      warehouseId: sale.warehouseId,
      cashierId: sale.cashierId,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      total: Number(sale.total),
      status: sale.status,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: sale.items.map((item) => ({
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount),
        tax: Number(item.tax),
        subtotal: Number(item.subtotal),
      })),
    };
  }

  async updateStatus(_id: string, _status: string) {
    await this._prisma.sale.update({
      where: { id: _id },
      data: { status: _status as 'PENDING' | 'COMPLETED' | 'VOIDED' | 'REFUNDED' },
    });
  }

  async void(_id: string) {
    await this._prisma.sale.update({
      where: { id: _id },
      data: { status: 'VOIDED' },
    });
  }
}
