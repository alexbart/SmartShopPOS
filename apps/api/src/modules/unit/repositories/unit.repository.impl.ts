import { PrismaClient } from '@prisma/client';
import type { IUnitRepository } from './unit.repository.js';

export class UnitRepositoryImpl implements IUnitRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<IUnitRepository['create']>[0]) {
    const unit = await this._prisma.unit.create({
      data: {
        organizationId: _model.organizationId,
        name: _model.name,
        code: _model.code,
        description: _model.description,
        abbreviation: _model.abbreviation,
      },
      select: { id: true },
    });

    return unit.id;
  }

  async update(_model: Parameters<IUnitRepository['update']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.name !== undefined) data.name = _model.name;
    if (_model.code !== undefined) data.code = _model.code;
    if (_model.description !== undefined) data.description = _model.description;
    if (_model.abbreviation !== undefined) data.abbreviation = _model.abbreviation;
    if (_model.isActive !== undefined) data.isActive = _model.isActive;

    await this._prisma.unit.update({
      where: { id: _model.id },
      data,
    });
  }

  async findById(_id: string, _organizationId: string) {
    const unit = await this._prisma.unit.findFirst({
      where: { id: _id, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        abbreviation: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return unit;
  }

  async findByCode(_code: string, _organizationId: string) {
    const unit = await this._prisma.unit.findFirst({
      where: { code: _code, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        abbreviation: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return unit;
  }

  async findAll(_query: Parameters<IUnitRepository['findAll']>[0]) {
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
      this._prisma.unit.findMany({
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
          abbreviation: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this._prisma.unit.count({ where }),
    ]);

    return { items, total };
  }

  async softDelete(_id: string, _organizationId: string) {
    await this._prisma.unit.update({
      where: { id: _id },
      data: { deletedAt: new Date() },
    });
  }
}
