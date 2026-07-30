import { PrismaClient } from '@prisma/client';
import type { IBrandRepository } from './brand.repository.js';

export class BrandRepositoryImpl implements IBrandRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<IBrandRepository['create']>[0]) {
    const brand = await this._prisma.brand.create({
      data: {
        organizationId: _model.organizationId,
        name: _model.name,
        code: _model.code,
        description: _model.description,
        logoUrl: _model.logoUrl,
        website: _model.website,
      },
      select: { id: true },
    });

    return brand.id;
  }

  async update(_model: Parameters<IBrandRepository['update']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.name !== undefined) data.name = _model.name;
    if (_model.code !== undefined) data.code = _model.code;
    if (_model.description !== undefined) data.description = _model.description;
    if (_model.logoUrl !== undefined) data.logoUrl = _model.logoUrl;
    if (_model.website !== undefined) data.website = _model.website;
    if (_model.isActive !== undefined) data.isActive = _model.isActive;

    await this._prisma.brand.update({
      where: { id: _model.id },
      data,
    });
  }

  async findById(_id: string, _organizationId: string) {
    const brand = await this._prisma.brand.findFirst({
      where: { id: _id, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        logoUrl: true,
        website: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return brand;
  }

  async findByCode(_code: string, _organizationId: string) {
    const brand = await this._prisma.brand.findFirst({
      where: { code: _code, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        logoUrl: true,
        website: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return brand;
  }

  async findAll(_query: Parameters<IBrandRepository['findAll']>[0]) {
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
      this._prisma.brand.findMany({
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
          logoUrl: true,
          website: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this._prisma.brand.count({ where }),
    ]);

    return { items, total };
  }

  async softDelete(_id: string, _organizationId: string) {
    await this._prisma.brand.update({
      where: { id: _id },
      data: { deletedAt: new Date() },
    });
  }
}
