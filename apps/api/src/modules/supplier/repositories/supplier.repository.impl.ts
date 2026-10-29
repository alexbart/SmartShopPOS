import { PrismaClient } from '@prisma/client';
import type { ISupplierRepository } from './supplier.repository.js';

export class SupplierRepositoryImpl implements ISupplierRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<ISupplierRepository['create']>[0]) {
    const supplier = await this._prisma.supplier.create({
      data: {
        organizationId: _model.organizationId,
        code: _model.code,
        name: _model.name,
        contactPerson: _model.contactPerson,
        email: _model.email,
        phone: _model.phone,
        taxPin: _model.taxPin,
        creditLimit: _model.creditLimit,
        paymentTerms: _model.paymentTerms,
      },
      select: { id: true },
    });

    return supplier.id;
  }

  async update(_model: Parameters<ISupplierRepository['update']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.code !== undefined) data.code = _model.code;
    if (_model.name !== undefined) data.name = _model.name;
    if (_model.contactPerson !== undefined) data.contactPerson = _model.contactPerson;
    if (_model.email !== undefined) data.email = _model.email;
    if (_model.phone !== undefined) data.phone = _model.phone;
    if (_model.taxPin !== undefined) data.taxPin = _model.taxPin;
    if (_model.creditLimit !== undefined) data.creditLimit = _model.creditLimit;
    if (_model.paymentTerms !== undefined) data.paymentTerms = _model.paymentTerms;
    if (_model.isActive !== undefined) data.isActive = _model.isActive;

    await this._prisma.supplier.update({
      where: { id: _model.id },
      data,
    });
  }

  async findById(_id: string, _organizationId: string) {
    const supplier = await this._prisma.supplier.findFirst({
      where: { id: _id, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        code: true,
        name: true,
        contactPerson: true,
        email: true,
        phone: true,
        taxPin: true,
        creditLimit: true,
        paymentTerms: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return supplier
      ? {
          ...supplier,
          creditLimit: supplier.creditLimit ? Number(supplier.creditLimit) : undefined,
        }
      : null;
  }

  async findByCode(_code: string, _organizationId: string) {
    const supplier = await this._prisma.supplier.findFirst({
      where: { code: _code, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        code: true,
        name: true,
        contactPerson: true,
        email: true,
        phone: true,
        taxPin: true,
        creditLimit: true,
        paymentTerms: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return supplier
      ? {
          ...supplier,
          creditLimit: supplier.creditLimit ? Number(supplier.creditLimit) : undefined,
        }
      : null;
  }

  async findAll(_query: Parameters<ISupplierRepository['findAll']>[0]) {
    const where: Record<string, unknown> = {
      organizationId: _query.organizationId,
      deletedAt: null,
    };

    if (_query.search) {
      where.OR = [
        { name: { contains: _query.search, mode: 'insensitive' } },
        { code: { contains: _query.search, mode: 'insensitive' } },
        { email: { contains: _query.search, mode: 'insensitive' } },
        { phone: { contains: _query.search, mode: 'insensitive' } },
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
      this._prisma.supplier.findMany({
        where,
        orderBy,
        skip: (_query.page - 1) * _query.limit,
        take: _query.limit,
        select: {
          id: true,
          organizationId: true,
          code: true,
          name: true,
          contactPerson: true,
          email: true,
          phone: true,
          taxPin: true,
          creditLimit: true,
          paymentTerms: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this._prisma.supplier.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        ...s,
        creditLimit: s.creditLimit ? Number(s.creditLimit) : undefined,
      })),
      total,
    };
  }

  async softDelete(_id: string, _organizationId: string) {
    await this._prisma.supplier.update({
      where: { id: _id },
      data: { deletedAt: new Date() },
    });
  }
}
