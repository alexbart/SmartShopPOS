import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { IReceiptRepository } from './receipt.repository.js';

export class ReceiptRepositoryImpl implements IReceiptRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(_model: Parameters<IReceiptRepository['create']>[0]) {
    const receipt = await this._prisma.receipt.create({
      data: {
        organizationId: _model.organizationId,
        saleId: _model.saleId,
        number: _model.number,
        issuedAt: _model.issuedAt,
      },
      select: { id: true },
    });

    return receipt.id;
  }

  async findById(_id: string, _organizationId: string) {
    const receipt = await this._prisma.receipt.findFirst({
      where: { id: _id, organizationId: _organizationId },
      select: {
        id: true,
        organizationId: true,
        saleId: true,
        number: true,
        issuedAt: true,
        createdAt: true,
      },
    });

    return receipt;
  }

  async findByNumber(_number: string, _organizationId: string) {
    const receipt = await this._prisma.receipt.findFirst({
      where: { number: _number, organizationId: _organizationId },
      select: {
        id: true,
        organizationId: true,
        saleId: true,
        number: true,
        issuedAt: true,
        createdAt: true,
      },
    });

    return receipt;
  }

  async findBySaleId(_saleId: string, _organizationId: string) {
    const receipt = await this._prisma.receipt.findFirst({
      where: { saleId: _saleId, organizationId: _organizationId },
      select: {
        id: true,
        organizationId: true,
        saleId: true,
        number: true,
        issuedAt: true,
        createdAt: true,
      },
    });

    return receipt;
  }
}
