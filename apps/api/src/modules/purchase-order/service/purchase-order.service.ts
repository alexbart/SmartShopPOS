import type { PrismaClient } from '@prisma/client';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { PurchaseOrderRepositoryImpl } from '../repository/purchase-order.repository.impl.js';
import type {
  CreatePurchaseOrderCommand,
  UpdatePurchaseOrderCommand,
  ReceiveGoodsCommand,
  PurchaseOrderEntity,
} from '../repository/purchase-order.repository.js';
import type { NumberSequenceService } from '../../../shared/services/number-sequence/number-sequence.service.js';
import { PurchaseOrderStatuses } from '../repository/purchase-order.repository.js';
import { NumberSequenceTypes, MovementTypes } from '../../../shared/constants/domain-constants.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/business-error.js';
import { AuditLogRepositoryImpl } from '../../inventory/repositories/audit-log.repository.impl.js';
import { StockRepositoryImpl } from '../../inventory/repositories/stock.repository.impl.js';
import { StockMovementRepositoryImpl } from '../../inventory/repositories/stock-movement.repository.impl.js';
import { MovementTypes } from '../../../shared/constants/domain-constants.js';

export class PurchaseOrderService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _numberSequenceService: NumberSequenceService,
    private readonly _prisma: PrismaClient,
  ) {}

  async create(command: CreatePurchaseOrderCommand): Promise<PurchaseOrderEntity> {
    const orderNumber = await this._numberSequenceService.next(
      NumberSequenceTypes.PURCHASE_ORDER,
      command.organizationId,
    );

    const items = command.items.map((item) => {
      const itemSubtotal =
        Number(item.quantity) * Number(item.unitCost) - (item.discount ?? 0) + (item.tax ?? 0);
      return {
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        discount: item.discount ?? 0,
        tax: item.tax ?? 0,
        subtotal: itemSubtotal,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = command.discount ?? 0;
    const tax = command.tax ?? 0;
    const total = subtotal - discount + tax;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return this._unitOfWork.execute(async (tx) => {
      const poRepo = new PurchaseOrderRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);

      const poId = await poRepo.create({
        organizationId: command.organizationId,
        branchId: command.branchId,
        warehouseId: command.warehouseId,
        supplierId: command.supplierId,
        orderNumber,
        expectedDeliveryDate: command.expectedDeliveryDate,
        items,
        subtotal,
        tax,
        discount,
        total,
        totalQuantity,
        receivedQuantity: 0,
        notes: command.notes,
        createdBy: command.createdBy,
        status: PurchaseOrderStatuses.DRAFT,
      });

      await auditRepo.create({
        organizationId: command.organizationId,
        actorId: command.createdBy,
        action: 'CREATE',
        entity: 'PurchaseOrder',
        entityId: poId,
        oldValues: {},
        newValues: { orderNumber, status: PurchaseOrderStatuses.DRAFT },
      });

      const po = await poRepo.findById(poId, command.organizationId);
      if (!po) {
        throw new NotFoundError('Purchase order not found after creation.');
      }

      return po;
    });
  }

  async findById(id: string, organizationId: string): Promise<PurchaseOrderEntity> {
    const poRepo = new PurchaseOrderRepositoryImpl(this._prisma);
    const po = await poRepo.findById(id, organizationId);
    if (!po) {
      throw new NotFoundError('Purchase order not found.');
    }
    return po;
  }

  async update(command: UpdatePurchaseOrderCommand): Promise<PurchaseOrderEntity> {
    const poRepo = new PurchaseOrderRepositoryImpl(this._prisma);
    const existing = await poRepo.findById(command.id, command.organizationId);
    if (!existing) {
      throw new NotFoundError('Purchase order not found.');
    }

    if (existing.status !== PurchaseOrderStatuses.DRAFT) {
      throw new ConflictError('Only draft purchase orders can be modified.');
    }

    const items = command.items
      ? command.items.map((item) => {
          const itemSubtotal =
            Number(item.quantity) * Number(item.unitCost) - (item.discount ?? 0) + (item.tax ?? 0);
          return {
            productId: item.productId,
            quantity: Number(item.quantity),
            unitCost: Number(item.unitCost),
            discount: item.discount ?? 0,
            tax: item.tax ?? 0,
            subtotal: itemSubtotal,
          };
        })
      : undefined;

    let discount = existing.discount;
    let tax = existing.tax;

    if (items) {
      discount = command.discount ?? existing.discount;
      tax = command.tax ?? existing.tax;
    } else {
      discount = command.discount ?? existing.discount;
      tax = command.tax ?? existing.tax;
    }

    return this._unitOfWork.execute(async (tx) => {
      const updateRepo = new PurchaseOrderRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);

      const updated = await updateRepo.update(command.id, {
        expectedDeliveryDate: command.expectedDeliveryDate,
        items: items ?? [],
        discount,
        tax,
        notes: command.notes,
      });

      if (!updated) {
        throw new NotFoundError('Purchase order not found after update.');
      }

      await auditRepo.create({
        organizationId: command.organizationId,
        actorId: command.createdBy ?? existing.createdBy,
        action: 'UPDATE',
        entity: 'PurchaseOrder',
        entityId: command.id,
        oldValues: existing,
        newValues: updated,
      });

      return updated;
    });
  }

  async submit(id: string, organizationId: string): Promise<PurchaseOrderEntity> {
    const poRepo = new PurchaseOrderRepositoryImpl(this._prisma);
    const existing = await poRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundError('Purchase order not found.');
    }

    if (existing.status !== PurchaseOrderStatuses.DRAFT) {
      throw new ConflictError('Only draft purchase orders can be submitted.');
    }

    return this._unitOfWork.execute(async (tx) => {
      const updateRepo = new PurchaseOrderRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);

      await updateRepo.updateStatus(id, PurchaseOrderStatuses.SUBMITTED);

      await auditRepo.create({
        organizationId,
        actorId: existing.createdBy,
        action: 'SUBMIT',
        entity: 'PurchaseOrder',
        entityId: id,
        oldValues: { status: existing.status },
        newValues: { status: PurchaseOrderStatuses.SUBMITTED },
      });

      const updated = await updateRepo.findById(id, organizationId);
      if (!updated) {
        throw new NotFoundError('Purchase order not found after submission.');
      }

      return updated;
    });
  }

  async cancel(id: string, organizationId: string): Promise<void> {
    const poRepo = new PurchaseOrderRepositoryImpl(this._prisma);
    const existing = await poRepo.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundError('Purchase order not found.');
    }

    if (existing.status === PurchaseOrderStatuses.RECEIVED) {
      throw new ConflictError('Cannot cancel a received purchase order.');
    }

    if (existing.status === PurchaseOrderStatuses.CANCELLED) {
      throw new ConflictError('Purchase order is already cancelled.');
    }

    await this._unitOfWork.execute(async (tx) => {
      const updateRepo = new PurchaseOrderRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);

      await updateRepo.updateStatus(id, PurchaseOrderStatuses.CANCELLED);

      await auditRepo.create({
        organizationId,
        actorId: existing.createdBy,
        action: 'CANCEL',
        entity: 'PurchaseOrder',
        entityId: id,
        oldValues: { status: existing.status },
        newValues: { status: PurchaseOrderStatuses.CANCELLED },
      });
    });
  }

  async receiveGoods(command: ReceiveGoodsCommand): Promise<{
    goodsReceiptId: string;
    status: string;
    receivedQuantity: number;
    totalQuantity: number;
  }> {
    const poRepo = new PurchaseOrderRepositoryImpl(this._prisma);
    const existing = await poRepo.findById(command.purchaseOrderId, command.organizationId);
    if (!existing) {
      throw new NotFoundError('Purchase order not found.');
    }

    const validStatuses = [
      PurchaseOrderStatuses.SUBMITTED,
      PurchaseOrderStatuses.APPROVED,
      PurchaseOrderStatuses.PARTIALLY_RECEIVED,
    ];

    if (!validStatuses.includes(existing.status)) {
      throw new ConflictError(`Purchase order in ${existing.status} status cannot receive goods.`);
    }

    const orderedQuantities: Record<string, number> = {};
    for (const item of existing.items) {
      orderedQuantities[item.productId] =
        (orderedQuantities[item.productId] ?? 0) + Number(item.quantity);
    }

    const receivedQuantities: Record<string, number> = {};
    for (const receiveItem of command.items) {
      const alreadyReceived = existing.items.find((i) => i.productId === receiveItem.productId);
      if (!alreadyReceived) {
        throw new NotFoundError(
          `Product ${receiveItem.productId} not found in this purchase order.`,
        );
      }

      receivedQuantities[receiveItem.productId] =
        (receivedQuantities[receiveItem.productId] ?? 0) + Number(receiveItem.quantity);
    }

    for (const [productId, receiveQty] of Object.entries(receivedQuantities)) {
      const orderedQty = orderedQuantities[productId] ?? 0;
      const newTotal = existing.receivedQuantity + receiveQty;
      if (newTotal > orderedQty) {
        throw new ConflictError(
          `Cannot receive ${receiveQty} ${productId}. Only ${orderedQty - existing.receivedQuantity} remaining to be received.`,
        );
      }
    }

    return this._unitOfWork.execute(async (tx) => {
      const txRepo = new PurchaseOrderRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);
      const stockRepo = new StockRepositoryImpl(tx);
      const movementRepo = new StockMovementRepositoryImpl(tx);
      const receiptNumber = await this._numberSequenceService.next(
        NumberSequenceTypes.GOODS_RECEIPT,
        command.organizationId,
      );

      const grn = await tx.purchaseOrder.update({
        where: { id: command.purchaseOrderId },
        data: {
          goodsReceipts: {
            create: {
              organizationId: command.organizationId,
              warehouseId: command.warehouseId,
              receiptNumber,
              receivedDate: new Date(),
              createdBy: command.createdBy,
              notes: command.notes,
              items: {
                create: command.items.map((item) => ({
                  productId: item.productId,
                  quantity: Number(item.quantity),
                  unitCost: Number(item.unitCost),
                })),
              },
            },
          },
        },
        select: { id: true },
      });

      for (const receiveItem of command.items) {
        const stockId = await stockRepo.createOrGet({
          organizationId: command.organizationId,
          warehouseId: command.warehouseId,
          productId: receiveItem.productId,
        });

        const stock = await stockRepo.findById(stockId, command.organizationId);
        if (!stock) {
          throw new NotFoundError('Stock not found after creation.');
        }

        const newQuantity = Number(stock.quantity) + Number(receiveItem.quantity);

        await movementRepo.create({
          organizationId: command.organizationId,
          warehouseId: command.warehouseId,
          productId: receiveItem.productId,
          stockId,
          type: MovementTypes.PURCHASE,
          quantity: Number(receiveItem.quantity),
          referenceType: 'PURCHASE_ORDER',
          referenceId: command.purchaseOrderId,
          performedBy: command.createdBy,
        });

        await stockRepo.updateQuantity(stockId, newQuantity, Number(stock.reservedQuantity));

        await auditRepo.create({
          organizationId: command.organizationId,
          actorId: command.createdBy,
          action: 'RECEIVE_GOODS',
          entity: 'Stock',
          entityId: stockId,
          oldValues: { quantity: Number(stock.quantity) },
          newValues: { quantity: newQuantity },
        });
      }

      const totalReceivedItems = Object.values(receivedQuantities).reduce(
        (sum, qty) => sum + qty,
        0,
      );
      const newTotalReceived = existing.receivedQuantity + totalReceivedItems;
      const totalOrdered = Object.values(orderedQuantities).reduce((sum, qty) => sum + qty, 0);

      let newStatus: string;
      if (newTotalReceived >= totalOrdered) {
        newStatus = PurchaseOrderStatuses.RECEIVED;
      } else {
        newStatus = PurchaseOrderStatuses.PARTIALLY_RECEIVED;
      }

      await txRepo.updateStatus(command.purchaseOrderId, newStatus);
      await txRepo.updateReceivedQuantity(command.purchaseOrderId, newTotalReceived, totalOrdered);

      await auditRepo.create({
        organizationId: command.organizationId,
        actorId: command.createdBy,
        action: 'RECEIVE_GOODS',
        entity: 'PurchaseOrder',
        entityId: command.purchaseOrderId,
        oldValues: { status: existing.status, receivedQuantity: existing.receivedQuantity },
        newValues: { status: newStatus, receivedQuantity: newTotalReceived },
      });

      return {
        goodsReceiptId: grn.id,
        status: newStatus,
        receivedQuantity: newTotalReceived,
        totalQuantity: totalOrdered,
      };
    });
  }
}
