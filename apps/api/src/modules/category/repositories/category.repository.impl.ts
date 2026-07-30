import { PrismaClient } from '@prisma/client';
import type { ICategoryRepository } from './category.repository.js';

export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<ICategoryRepository['create']>[0]) {
    const category = await this._prisma.category.create({
      data: {
        organizationId: _model.organizationId,
        name: _model.name,
        code: _model.code,
        description: _model.description,
        color: _model.color,
        createdBy: _model.createdBy,
      },
      select: { id: true },
    });

    return category.id;
  }

  async update(_model: Parameters<ICategoryRepository['update']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.name !== undefined) data.name = _model.name;
    if (_model.code !== undefined) data.code = _model.code;
    if (_model.description !== undefined) data.description = _model.description;
    if (_model.color !== undefined) data.color = _model.color;
    if (_model.isActive !== undefined) data.isActive = _model.isActive;
    if (_model.updatedBy !== undefined) data.updatedBy = _model.updatedBy;

    await this._prisma.category.update({
      where: { id: _model.id },
      data,
    });
  }

  async findById(_id: string, _organizationId: string) {
    const category = await this._prisma.category.findFirst({
      where: { id: _id, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        color: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return category;
  }

  async findByCode(_code: string, _organizationId: string) {
    const category = await this._prisma.category.findFirst({
      where: { code: _code, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        color: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return category;
  }

  async findAll(_query: Parameters<ICategoryRepository['findAll']>[0]) {
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
      this._prisma.category.findMany({
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
          color: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this._prisma.category.count({ where }),
    ]);

    return { items, total };
  }

  async softDelete(_id: string, _organizationId: string) {
    await this._prisma.category.update({
      where: { id: _id },
      data: { deletedAt: new Date() },
    });
  }
}
