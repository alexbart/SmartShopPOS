import type { IProductRepository } from '../repositories/product.repository.js';
import type { CreateProductCommand } from '../commands/create-product.command.js';
import type { UpdateProductCommand } from '../commands/update-product.command.js';
import type { ProductQuery } from '../repositories/product.repository.js';
import type { ProductResponse } from '../responses/product.response.js';
import type { ProductListResponse } from '../responses/product-list.response.js';

export class ProductService {
  constructor(private readonly _repository: IProductRepository) {}

  async create(command: CreateProductCommand): Promise<ProductResponse> {
    const existingByCode = await this._repository.findByCode(command.code, command.organizationId);
    if (existingByCode) {
      throw new Error('Product code already exists.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    if (command.sku) {
      const existingBySku = await this._repository.findBySku(command.sku, command.organizationId);
      if (existingBySku) {
        throw new Error('Product SKU already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    const existingByName = await this._repository.findByCode(command.name, command.organizationId);
    if (existingByName) {
      throw new Error('Product name already exists.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    const id = await this._repository.create(command);

    const product = await this._repository.findById(id, command.organizationId);
    if (!product) {
      throw new Error('Product not found after creation.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(product);
  }

  async update(command: UpdateProductCommand): Promise<ProductResponse> {
    const existing = await this._repository.findById(command.id, command.organizationId);
    if (!existing) {
      throw new Error('Product not found.') as Error & { code: string; statusCode: number };
    }

    if (command.code && command.code !== existing.code) {
      const duplicate = await this._repository.findByCode(command.code, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Product code already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    if (command.name && command.name !== existing.name) {
      const duplicate = await this._repository.findByCode(command.name, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Product name already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    if (command.sku && command.sku !== existing.sku) {
      const duplicate = await this._repository.findBySku(command.sku, command.organizationId);
      if (duplicate && duplicate.id !== command.id) {
        throw new Error('Product SKU already exists.') as Error & {
          code: string;
          statusCode: number;
        };
      }
    }

    await this._repository.update(command);

    const updated = await this._repository.findById(command.id, command.organizationId);
    if (!updated) {
      throw new Error('Product not found after update.') as Error & {
        code: string;
        statusCode: number;
      };
    }

    return this.toResponse(updated);
  }

  async findById(id: string, organizationId: string): Promise<ProductResponse> {
    const product = await this._repository.findById(id, organizationId);
    if (!product) {
      throw new Error('Product not found.') as Error & { code: string; statusCode: number };
    }

    return this.toResponse(product);
  }

  async findAll(query: ProductQuery): Promise<ProductListResponse> {
    const { items, total } = await this._repository.findAll(query);

    return {
      items: items.map((product) => this.toResponse(product)),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    };
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const product = await this._repository.findById(id, organizationId);
    if (!product) {
      throw new Error('Product not found.') as Error & { code: string; statusCode: number };
    }

    await this._repository.softDelete(id, organizationId);
  }

  private toResponse(product: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    description?: string;
    sku?: string;
    barcode?: string;
    categoryId?: string;
    categoryName?: string;
    brandId?: string;
    brandName?: string;
    unitId: string;
    unitName?: string;
    unitAbbreviation?: string;
    taxId?: string;
    taxName?: string;
    taxRate?: number;
    costPrice: number;
    sellingPrice: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ProductResponse {
    return {
      id: product.id,
      organizationId: product.organizationId,
      name: product.name,
      code: product.code,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      brandId: product.brandId,
      brandName: product.brandName,
      unitId: product.unitId,
      unitName: product.unitName,
      unitAbbreviation: product.unitAbbreviation,
      taxId: product.taxId,
      taxName: product.taxName,
      taxRate: product.taxRate,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
