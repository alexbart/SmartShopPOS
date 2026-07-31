import type { PrismaClient } from '@prisma/client';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { SaleRepositoryImpl } from '../repositories/sale.repository.impl.js';
import type { CreateSaleCommand } from '../commands/create-sale.command.js';
import type { SaleResponse } from '../responses/sale.response.js';
import type { NumberSequenceService } from '../../../shared/services/number-sequence/number-sequence.service.js';
import type { StockService } from '../../inventory/services/stock.service.js';

export class SaleService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _numberSequenceService: NumberSequenceService,
    private readonly _stockService: StockService,
    private readonly _prisma: PrismaClient,
  ) {}

  async create(command: CreateSaleCommand): Promise<SaleResponse> {
    const invoiceNumber = await this._numberSequenceService.next('SALE', command.organizationId);

    return this._unitOfWork.execute(async (tx) => {
      const saleRepo = new SaleRepositoryImpl(tx);

      const items = command.items.map((item) => {
        const itemSubtotal = Number(item.price) * Number(item.quantity) - (item.discount ?? 0);
        return {
          productId: item.productId,
          quantity: Number(item.quantity),
          price: Number(item.price),
          discount: item.discount ?? 0,
          tax: item.tax ?? 0,
          subtotal: itemSubtotal,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const discount = command.discount ?? 0;
      const tax = command.tax ?? 0;
      const total = subtotal - discount + tax;

      const saleId = await saleRepo.create({
        organizationId: command.organizationId,
        number: invoiceNumber,
        warehouseId: command.warehouseId,
        cashierId: command.cashierId,
        customerId: command.customerId,
        items,
        subtotal,
        discount,
        tax,
        total,
        status: 'PENDING',
      });

      await saleRepo.createItems(saleId, items);

      for (const item of items) {
        await this._stockService.decrease({
          organizationId: command.organizationId,
          warehouseId: command.warehouseId,
          productId: item.productId,
          quantity: item.quantity,
          type: 'SALE',
          performedBy: command.cashierId,
          referenceType: 'SALE',
          referenceId: saleId,
        });
      }

      await saleRepo.updateStatus(saleId, 'COMPLETED');

      const sale = await saleRepo.findById(saleId, command.organizationId);
      if (!sale) {
        throw new Error('Sale not found after creation.') as Error & {
          code: string;
          statusCode: number;
        };
      }

      return this.toResponse(sale);
    });
  }

  async findById(id: string, organizationId: string): Promise<SaleResponse> {
    const saleRepo = new SaleRepositoryImpl(this._prisma);
    const sale = await saleRepo.findById(id, organizationId);
    if (!sale) {
      throw new Error('Sale not found.') as Error & { code: string; statusCode: number };
    }
    return this.toResponse(sale);
  }

  async void(id: string, organizationId: string): Promise<void> {
    const saleRepo = new SaleRepositoryImpl(this._prisma);
    const sale = await saleRepo.findById(id, organizationId);
    if (!sale) {
      throw new Error('Sale not found.') as Error & { code: string; statusCode: number };
    }

    if (sale.status === 'VOIDED') {
      throw new Error('Sale is already voided.') as Error & { code: string; statusCode: number };
    }

    if (sale.status === 'REFUNDED') {
      throw new Error('Cannot void a refunded sale.') as Error & { code: string; statusCode: number };
    }

    await this._unitOfWork.execute(async (tx) => {
      const txSaleRepo = new SaleRepositoryImpl(tx);

      for (const item of sale.items) {
        await this._stockService.increase({
          organizationId: sale.organizationId,
          warehouseId: sale.warehouseId,
          productId: item.productId,
          quantity: Number(item.quantity),
          type: 'RETURN',
          performedBy: undefined,
          referenceType: 'SALE_VOID',
          referenceId: sale.id,
        });
      }

      await txSaleRepo.void(sale.id);
    });
  }

  private toResponse(sale: {
    id: string;
    organizationId: string;
    number: string;
    customerId?: string;
    warehouseId: string;
    cashierId: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      saleId: string;
      productId: string;
      quantity: number;
      price: number;
      discount: number;
      tax: number;
      subtotal: number;
    }>;
  }): SaleResponse {
    return {
      id: sale.id,
      organizationId: sale.organizationId,
      number: sale.number,
      customerId: sale.customerId,
      warehouseId: sale.warehouseId,
      cashierId: sale.cashierId,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      total: Number(sale.total),
      status: sale.status,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount),
        tax: Number(item.tax),
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
