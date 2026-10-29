import { PrismaClient } from '@prisma/client';
import type { ITaxRepository } from './tax.repository.js';

export class TaxRepositoryImpl implements ITaxRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<ITaxRepository['create']>[0]) {
    const tax = await this._prisma.tax.create({
      data: {
        organizationId: _model.organizationId,
        name: _model.name,
        code: _model.code,
        description: _model.description,
        rate: _model.rate,
      },
      select: { id: true },
    });

    return tax.id;
  }

  async update(_model: Parameters<ITaxRepository['update']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.name !== undefined) data.name = _model.name;
    if (_model.code !== undefined) data.code = _model.code;
    if (_model.description !== undefined) data.description = _model.description;
    if (_model.rate !== undefined) data.rate = _model.rate;
    if (_model.isActive !== undefined) data.isActive = _model.isActive;

    await this._prisma.tax.update({
      where: { id: _model.id },
      data,
    });
  }

  async findById(_id: string, _organizationId: string) {
    const tax = await this._prisma.tax.findFirst({
      where: { id: _id, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        rate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return tax ? { ...tax, rate: Number(tax.rate) } : null;
  }

  async findByCode(_code: string, _organizationId: string) {
    const tax = await this._prisma.tax.findFirst({
      where: { code: _code, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        rate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return tax ? { ...tax, rate: Number(tax.rate) } : null;
  }

  async findAll(_query: Parameters<ITaxRepository['findAll']>[0]) {
    const where: Record<string, unknown> = {
      organizationId: _query.organizationId,
      deletedAt: null,
    };

    if (_query.search) {
      where.OR = [
        { name: { contains: _query.search, mode: 'insensitive' } },
        { code: { contains: _query.search, mode: 'insensitive' } },
      ];
    }

    if (_query.active !== undefined) {
      where.isActive = _query.active;
    }

    const orderBy: Record<string, unknown> = {};
    if (_query.sortBy) {
      orderBy[_query.sortBy] = _query.sortOrder ?? 'asc';
    } else {
      orderBy.name = 'asc';
    }

    const [items, total] = await Promise.all([
      this._prisma.tax.findMany({
        where,
        orderBy,
        skip: (_query.page - 1) * _query.limit,
        take: _query.limit,
        select: {
          id: true,
          organizationId: true,
          name: true,
          code: true,
          description: true,
          rate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this._prisma.tax.count({ where }),
    ]);

    return { items: items.map((t) => ({ ...t, rate: Number(t.rate) })), total };
  }

  async softDelete(_id: string, _organizationId: string) {
    await this._prisma.tax.update({
      where: { id: _id },
      data: { deletedAt: new Date() },
    });
  }
}
