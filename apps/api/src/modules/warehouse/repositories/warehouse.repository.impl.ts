import { PrismaClient } from '@prisma/client';
import type { IWarehouseRepository } from './warehouse.repository.js';

export class WarehouseRepositoryImpl implements IWarehouseRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<IWarehouseRepository['create']>[0]) {
    const warehouse = await this._prisma.warehouse.create({
      data: {
        organizationId: _model.organizationId,
        branchId: _model.branchId,
        code: _model.code,
        name: _model.name,
        description: _model.description,
        isDefault: _model.isDefault ?? false,
      },
      select: { id: true },
    });

    return warehouse.id;
  }

  async update(_model: Parameters<IWarehouseRepository['update']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.code !== undefined) data.code = _model.code;
    if (_model.name !== undefined) data.name = _model.name;
    if (_model.description !== undefined) data.description = _model.description;
    if (_model.isDefault !== undefined) data.isDefault = _model.isDefault;
    if (_model.isActive !== undefined) data.isActive = _model.isActive;

    await this._prisma.warehouse.update({
      where: { id: _model.id },
      data,
    });
  }

  async findById(_id: string, _organizationId: string) {
    const warehouse = await this._prisma.warehouse.findFirst({
      where: { id: _id, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        branchId: true,
        code: true,
        name: true,
        description: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return warehouse;
  }

  async findByCode(_code: string, _organizationId: string) {
    const warehouse = await this._prisma.warehouse.findFirst({
      where: { code: _code, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        branchId: true,
        code: true,
        name: true,
        description: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return warehouse;
  }

  async findAll(_query: Parameters<IWarehouseRepository['findAll']>[0]) {
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

    if (_query.branchId) {
      where.branchId = _query.branchId;
    }

    const orderBy: Record<string, unknown> = {};
    if (_query.sortBy) {
      orderBy[_query.sortBy] = _query.sortOrder ?? 'asc';
    } else {
      orderBy.name = 'asc';
    }

    const [items, total] = await Promise.all([
      this._prisma.warehouse.findMany({
        where,
        orderBy,
        skip: (_query.page - 1) * _query.limit,
        take: _query.limit,
        select: {
          id: true,
          organizationId: true,
          branchId: true,
          code: true,
          name: true,
          description: true,
          isDefault: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this._prisma.warehouse.count({ where }),
    ]);

    return { items, total };
  }

  async softDelete(_id: string, _organizationId: string) {
    await this._prisma.warehouse.update({
      where: { id: _id },
      data: { deletedAt: new Date() },
    });
  }
}
