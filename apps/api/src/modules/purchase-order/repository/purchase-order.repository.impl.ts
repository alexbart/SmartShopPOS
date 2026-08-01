import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type {
  IPurchaseOrderRepository,
  CreatePurchaseOrderModel,
  UpdatePurchaseOrderModel,
  PurchaseOrderEntity,
} from './purchase-order.repository.js';

export class PurchaseOrderRepositoryImpl implements IPurchaseOrderRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(model: CreatePurchaseOrderModel): Promise<string> {
    const po = await this._prisma.purchaseOrder.create({
      data: {
        organizationId: model.organizationId,
        branchId: model.branchId,
        warehouseId: model.warehouseId,
        supplierId: model.supplierId,
        orderNumber: model.orderNumber,
        expectedDeliveryDate: model.expectedDeliveryDate,
        subtotal: model.subtotal,
        tax: model.tax,
        discount: model.discount,
        total: model.total,
        notes: model.notes,
        createdBy: model.createdBy,
        status: model.status,
        receivedQuantity: model.receivedQuantity,
        totalQuantity: model.totalQuantity,
        items: {
          create: model.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            discount: item.discount,
            tax: item.tax,
            subtotal: item.subtotal,
          })),
        },
      },
      select: { id: true },
    });

    return po.id;
  }

  async findById(id: string, organizationId: string): Promise<PurchaseOrderEntity | null> {
    const po = await this._prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        items: true,
        supplier: { select: { name: true, code: true } },
      },
    });

    if (!po) return null;

    return this._toEntity(po);
  }

  async list(
    organizationId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: PurchaseOrderEntity[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [pos, total] = await Promise.all([
      this._prisma.purchaseOrder.findMany({
        where: { organizationId },
        include: {
          items: true,
          supplier: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this._prisma.purchaseOrder.count({ where: { organizationId } }),
    ]);

    return {
      items: pos.map((po) => this._toEntity(po)),
      total,
      page,
      limit,
    };
  }

  async findByNumber(number: string, organizationId: string): Promise<PurchaseOrderEntity | null> {
    const po = await this._prisma.purchaseOrder.findFirst({
      where: { orderNumber: number, organizationId },
      include: {
        items: true,
        supplier: { select: { name: true, code: true } },
      },
    });

    if (!po) return null;

    return this._toEntity(po);
  }

  async update(id: string, model: UpdatePurchaseOrderModel): Promise<PurchaseOrderEntity | null> {
    const data: Record<string, unknown> = {};

    if (model.expectedDeliveryDate !== undefined) {
      data.expectedDeliveryDate = model.expectedDeliveryDate;
    }
    if (model.notes !== undefined) {
      data.notes = model.notes;
    }
    if (model.discount !== undefined) {
      data.discount = model.discount;
    }
    if (model.tax !== undefined) {
      data.tax = model.tax;
    }

    if (model.items && model.items.length > 0) {
      const po = await this._prisma.purchaseOrder.findUnique({
        where: { id },
        select: { organizationId: true },
      });

      if (!po) return null;

      return await this._prisma.$transaction(async (tx) => {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

        const subtotal = model.items.reduce((sum, item) => sum + item.subtotal, 0);
        const discount = model.discount ?? 0;
        const tax = model.tax ?? 0;
        const total = subtotal - discount + tax;

        const updated = await tx.purchaseOrder.update({
          where: { id },
          data: {
            ...data,
            items: {
              create: model.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                discount: item.discount,
                tax: item.tax,
                subtotal: item.subtotal,
              })),
            },
            subtotal,
            tax,
            discount,
            total,
          },
          include: {
            items: true,
            supplier: { select: { name: true, code: true } },
          },
        });

        return this._toEntity(updated);
      });
    }

    const updated = await this._prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        items: true,
        supplier: { select: { name: true, code: true } },
      },
    });

    return this._toEntity(updated);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this._prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }

  async updateReceivedQuantity(
    id: string,
    receivedQuantity: number,
    totalQuantity: number,
  ): Promise<void> {
    await this._prisma.purchaseOrder.update({
      where: { id },
      data: {
        receivedQuantity,
        totalQuantity,
      },
    });
  }

  private _toEntity(po: {
    id: string;
    organizationId: string;
    branchId: string;
    warehouseId: string;
    supplierId: string;
    orderNumber: string;
    status: string;
    expectedDeliveryDate: Date | null;
    receivedQuantity: number;
    totalQuantity: number;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    notes: string | null;
    createdBy: string;
    approvedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      purchaseOrderId: string;
      productId: string;
      quantity: number;
      unitCost: number;
      discount: number;
      tax: number;
      subtotal: number;
    }>;
    supplier: { name: string; code: string };
  }): PurchaseOrderEntity {
    return {
      id: po.id,
      organizationId: po.organizationId,
      branchId: po.branchId,
      warehouseId: po.warehouseId,
      supplierId: po.supplierId,
      orderNumber: po.orderNumber,
      status: po.status,
      expectedDeliveryDate: po.expectedDeliveryDate ?? undefined,
      receivedQuantity: Number(po.receivedQuantity),
      totalQuantity: Number(po.totalQuantity),
      subtotal: Number(po.subtotal),
      tax: Number(po.tax),
      discount: Number(po.discount),
      total: Number(po.total),
      notes: po.notes ?? undefined,
      createdBy: po.createdBy,
      approvedBy: po.approvedBy ?? undefined,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      items: po.items.map((item) => ({
        id: item.id,
        purchaseOrderId: item.purchaseOrderId,
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        discount: Number(item.discount),
        tax: Number(item.tax),
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
