import type { PrismaClient } from '@prisma/client';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { SaleRepositoryImpl } from '../repositories/sale.repository.impl.js';
import type { CreateSaleCommand } from '../commands/create-sale.command.js';
import type { SaleResponse } from '../responses/sale.response.js';
import type { NumberSequenceService } from '../../../shared/services/number-sequence/number-sequence.service.js';
import type { StockService } from '../../inventory/services/stock.service.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import { SaleCreatedEvent, SaleVoidedEvent } from '../../../shared/events/domain-events.js';
import { NumberSequenceTypes, SaleStatuses } from '../../../shared/constants/domain-constants.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/business-error.js';

export class SaleService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _numberSequenceService: NumberSequenceService,
    private readonly _stockService: StockService,
    private readonly _prisma: PrismaClient,
    private readonly _eventBus: EventBus,
  ) {}

  async create(command: CreateSaleCommand): Promise<SaleResponse> {
    const invoiceNumber = await this._numberSequenceService.next(
      NumberSequenceTypes.SALE,
      command.organizationId,
    );

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
        status: SaleStatuses.PENDING,
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

      await saleRepo.updateStatus(saleId, SaleStatuses.COMPLETED);

      const sale = await saleRepo.findById(saleId, command.organizationId);
      if (!sale) {
        throw new NotFoundError('Sale not found after creation.');
      }

      await this._eventBus.publish(
        new SaleCreatedEvent(saleId, command.organizationId, total, items),
      );

      return this.toResponse(sale);
    });
  }

  async findById(id: string, organizationId: string): Promise<SaleResponse> {
    const saleRepo = new SaleRepositoryImpl(this._prisma);
    const sale = await saleRepo.findById(id, organizationId);
    if (!sale) {
      throw new NotFoundError('Sale not found.');
    }
    return this.toResponse(sale);
  }

  async list(organizationId: string, page = 1, limit = 20) {
    const saleRepo = new SaleRepositoryImpl(this._prisma);
    return saleRepo.list(organizationId, page, limit);
  }

  async void(id: string, organizationId: string): Promise<void> {
    const saleRepo = new SaleRepositoryImpl(this._prisma);
    const sale = await saleRepo.findById(id, organizationId);
    if (!sale) {
      throw new NotFoundError('Sale not found.');
    }

    if (sale.status === SaleStatuses.VOIDED) {
      throw new ConflictError('Sale is already voided.');
    }

    if (sale.status === SaleStatuses.REFUNDED) {
      throw new ConflictError('Cannot void a refunded sale.');
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

      await this._eventBus.publish(
        new SaleVoidedEvent(
          sale.id,
          sale.organizationId,
          sale.items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
        ),
      );
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
