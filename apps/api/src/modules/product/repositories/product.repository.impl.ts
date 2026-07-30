import { PrismaClient } from '@prisma/client';
import type { IProductRepository } from './product.repository.js';

export class ProductRepositoryImpl implements IProductRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(_model: Parameters<IProductRepository['create']>[0]) {
    const product = await this._prisma.product.create({
      data: {
        organizationId: _model.organizationId,
        name: _model.name,
        code: _model.code,
        description: _model.description,
        sku: _model.sku,
        barcode: _model.barcode,
        categoryId: _model.categoryId,
        brandId: _model.brandId,
        unitId: _model.unitId,
        taxId: _model.taxId,
        costPrice: _model.costPrice,
        sellingPrice: _model.sellingPrice,
      },
      select: { id: true },
    });

    return product.id;
  }

  async update(_model: Parameters<IProductRepository['update']>[0]) {
    const data: Record<string, unknown> = {};

    if (_model.name !== undefined) data.name = _model.name;
    if (_model.code !== undefined) data.code = _model.code;
    if (_model.description !== undefined) data.description = _model.description;
    if (_model.sku !== undefined) data.sku = _model.sku;
    if (_model.barcode !== undefined) data.barcode = _model.barcode;
    if (_model.categoryId !== undefined) data.categoryId = _model.categoryId;
    if (_model.brandId !== undefined) data.brandId = _model.brandId;
    if (_model.unitId !== undefined) data.unitId = _model.unitId;
    if (_model.taxId !== undefined) data.taxId = _model.taxId;
    if (_model.costPrice !== undefined) data.costPrice = _model.costPrice;
    if (_model.sellingPrice !== undefined) data.sellingPrice = _model.sellingPrice;
    if (_model.isActive !== undefined) data.isActive = _model.isActive;

    await this._prisma.product.update({
      where: { id: _model.id },
      data,
    });
  }

  private select() {
    return {
      id: true,
      organizationId: true,
      name: true,
      code: true,
      description: true,
      sku: true,
      barcode: true,
      categoryId: true,
      brandId: true,
      unitId: true,
      taxId: true,
      costPrice: true,
      sellingPrice: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      brand: { select: { name: true } },
      unit: { select: { name: true, abbreviation: true } },
      tax: { select: { name: true, rate: true } },
    };
  }

  private mapEntity(row: Record<string, unknown>): ProductEntity {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      code: row.code,
      description: row.description,
      sku: row.sku,
      barcode: row.barcode,
      categoryId: row.categoryId,
      categoryName: row.category?.name,
      brandId: row.brandId,
      brandName: row.brand?.name,
      unitId: row.unitId,
      unitName: row.unit?.name,
      unitAbbreviation: row.unit?.abbreviation,
      taxId: row.taxId,
      taxName: row.tax?.name,
      taxRate: row.tax?.rate ? Number(row.tax.rate) : undefined,
      costPrice: Number(row.costPrice),
      sellingPrice: Number(row.sellingPrice),
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findById(_id: string, _organizationId: string) {
    const product = await this._prisma.product.findFirst({
      where: { id: _id, organizationId: _organizationId, deletedAt: null },
      select: this.select(),
    });

    return product ? this.mapEntity(product) : null;
  }

  async findByCode(_code: string, _organizationId: string) {
    const product = await this._prisma.product.findFirst({
      where: { code: _code, organizationId: _organizationId, deletedAt: null },
      select: this.select(),
    });

    return product ? this.mapEntity(product) : null;
  }

  async findBySku(_sku: string, _organizationId: string) {
    if (!_sku) return null;

    const product = await this._prisma.product.findFirst({
      where: { sku: _sku, organizationId: _organizationId, deletedAt: null },
      select: this.select(),
    });

    return product ? this.mapEntity(product) : null;
  }

  async findAll(_query: Parameters<IProductRepository['findAll']>[0]) {
    const where: Record<string, unknown> = {
      organizationId: _query.organizationId,
      deletedAt: null,
    };

    if (_query.search) {
      where.OR = [
        { name: { contains: _query.search, mode: 'insensitive' } },
        { code: { contains: _query.search, mode: 'insensitive' } },
        { sku: { equals: _query.search, mode: 'insensitive' } },
        { barcode: { equals: _query.search, mode: 'insensitive' } },
      ];
    }

    if (_query.active !== undefined) {
      where.isActive = _query.active;
    }

    if (_query.categoryId) {
      where.categoryId = _query.categoryId;
    }

    if (_query.brandId) {
      where.brandId = _query.brandId;
    }

    const orderBy: Record<string, unknown> = {};
    if (_query.sortBy) {
      orderBy[_query.sortBy] = _query.sortOrder ?? 'asc';
    } else {
      orderBy.name = 'asc';
    }

    const [items, total] = await Promise.all([
      this._prisma.product.findMany({
        where,
        orderBy,
        skip: (_query.page - 1) * _query.limit,
        take: _query.limit,
        select: this.select(),
      }),
      this._prisma.product.count({ where }),
    ]);

    return { items: items.map((row) => this.mapEntity(row)), total };
  }

  async softDelete(_id: string, _organizationId: string) {
    await this._prisma.product.update({
      where: { id: _id },
      data: { deletedAt: new Date() },
    });
  }
}
