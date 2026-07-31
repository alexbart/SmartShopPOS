import { PrismaClient } from '@prisma/client';
import type { ICustomerRepository } from './customer.repository.js';

export class CustomerRepositoryImpl implements ICustomerRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<ICustomerRepository['create']>[0]) {
    const customer = await this._prisma.customer.create({
      data: {
        organizationId: _model.organizationId,
        code: _model.code,
        name: _model.name,
        phone: _model.phone,
        email: _model.email,
        taxPin: _model.taxPin,
        address: _model.address,
        creditLimit: _model.creditLimit,
      },
      select: { id: true },
    });

    return customer.id;
  }

  async update(_model: Parameters<ICustomerRepository['update']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.code !== undefined) data.code = _model.code;
    if (_model.name !== undefined) data.name = _model.name;
    if (_model.phone !== undefined) data.phone = _model.phone;
    if (_model.email !== undefined) data.email = _model.email;
    if (_model.taxPin !== undefined) data.taxPin = _model.taxPin;
    if (_model.address !== undefined) data.address = _model.address;
    if (_model.creditLimit !== undefined) data.creditLimit = _model.creditLimit;
    if (_model.isActive !== undefined) data.isActive = _model.isActive;

    await this._prisma.customer.update({
      where: { id: _model.id },
      data,
    });
  }

  async findById(_id: string, _organizationId: string) {
    const customer = await this._prisma.customer.findFirst({
      where: { id: _id, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        code: true,
        name: true,
        phone: true,
        email: true,
        taxPin: true,
        address: true,
        loyaltyPoints: true,
        creditLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) return null;

    return {
      id: customer.id,
      organizationId: customer.organizationId,
      code: customer.code,
      name: customer.name,
      phone: customer.phone ?? undefined,
      email: customer.email ?? undefined,
      taxPin: customer.taxPin ?? undefined,
      address: customer.address ?? undefined,
      loyaltyPoints: Number(customer.loyaltyPoints),
      creditLimit: customer.creditLimit ? Number(customer.creditLimit) : undefined,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async findByCode(_code: string, _organizationId: string) {
    const customer = await this._prisma.customer.findFirst({
      where: { code: _code, organizationId: _organizationId, deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        code: true,
        name: true,
        phone: true,
        email: true,
        taxPin: true,
        address: true,
        loyaltyPoints: true,
        creditLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) return null;

    return {
      id: customer.id,
      organizationId: customer.organizationId,
      code: customer.code,
      name: customer.name,
      phone: customer.phone ?? undefined,
      email: customer.email ?? undefined,
      taxPin: customer.taxPin ?? undefined,
      address: customer.address ?? undefined,
      loyaltyPoints: Number(customer.loyaltyPoints),
      creditLimit: customer.creditLimit ? Number(customer.creditLimit) : undefined,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async findAll(_query: Parameters<ICustomerRepository['findAll']>[0]) {
    const where: Record<string, unknown> = {
      organizationId: _query.organizationId,
      deletedAt: null,
    };

    if (_query.search) {
      where.OR = [
        { name: { contains: _query.search, mode: 'insensitive' } },
        { code: { contains: _query.search, mode: 'insensitive' } },
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

    const [rawItems, total] = await Promise.all([
      this._prisma.customer.findMany({
        where,
        orderBy,
        skip: (_query.page - 1) * _query.limit,
        take: _query.limit,
        select: {
          id: true,
          organizationId: true,
          code: true,
          name: true,
          phone: true,
          email: true,
          taxPin: true,
          address: true,
          loyaltyPoints: true,
          creditLimit: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this._prisma.customer.count({ where }),
    ]);

    const items = rawItems.map((customer) => ({
      id: customer.id,
      organizationId: customer.organizationId,
      code: customer.code,
      name: customer.name,
      phone: customer.phone ?? undefined,
      email: customer.email ?? undefined,
      taxPin: customer.taxPin ?? undefined,
      address: customer.address ?? undefined,
      loyaltyPoints: Number(customer.loyaltyPoints),
      creditLimit: customer.creditLimit ? Number(customer.creditLimit) : undefined,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));

    return { items, total };
  }

  async softDelete(_id: string, _organizationId: string) {
    await this._prisma.customer.update({
      where: { id: _id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
