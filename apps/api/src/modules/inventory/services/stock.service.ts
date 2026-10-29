import type { PrismaClient } from '@prisma/client';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { StockRepositoryImpl } from '../repositories/stock.repository.impl.js';
import { StockMovementRepositoryImpl } from '../repositories/stock-movement.repository.impl.js';
import { AuditLogRepositoryImpl } from '../repositories/audit-log.repository.impl.js';
import type { StockMovementType } from '../repositories/stock-movement.repository.js';
import { InsufficientStockError, NotFoundError } from '../../../shared/errors/business-error.js';
import { MovementTypes } from '../../../shared/constants/domain-constants.js';

export class StockService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _prisma: PrismaClient,
  ) {}

  async increase(params: {
    organizationId: string;
    warehouseId: string;
    productId: string;
    quantity: number;
    type: StockMovementType;
    performedBy?: string;
    referenceType?: string;
    referenceId?: string;
    remarks?: string;
  }): Promise<void> {
    await this._unitOfWork.execute(async (tx) => {
      const stockRepo = new StockRepositoryImpl(tx);
      const movementRepo = new StockMovementRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);

      const stockId = await stockRepo.createOrGet({
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        productId: params.productId,
      });

      const stock = await stockRepo.findById(stockId, params.organizationId);
      if (!stock) {
        throw new NotFoundError('Stock not found after creation.');
      }

      const newQuantity = Number(stock.quantity) + params.quantity;

      await movementRepo.create({
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        productId: params.productId,
        stockId,
        type: params.type,
        quantity: params.quantity,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        performedBy: params.performedBy,
        remarks: params.remarks,
      });

      await stockRepo.updateQuantity(stockId, newQuantity, Number(stock.reservedQuantity));

      await auditRepo.create({
        organizationId: params.organizationId,
        actorId: params.performedBy,
        action: 'UPDATE',
        entity: 'Stock',
        entityId: stockId,
        oldValues: { quantity: Number(stock.quantity) },
        newValues: { quantity: newQuantity },
      });
    });
  }

  async decrease(params: {
    organizationId: string;
    warehouseId: string;
    productId: string;
    quantity: number;
    type: StockMovementType;
    performedBy?: string;
    referenceType?: string;
    referenceId?: string;
    remarks?: string;
  }): Promise<void> {
    await this._unitOfWork.execute(async (tx) => {
      const stockRepo = new StockRepositoryImpl(tx);
      const movementRepo = new StockMovementRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);

      const stock = await stockRepo.findByWarehouseAndProduct(
        params.warehouseId,
        params.productId,
        params.organizationId,
      );

      if (!stock) {
        throw new NotFoundError('Stock not found for warehouse and product.');
      }

      const newQuantity = Number(stock.quantity) - params.quantity;
      if (newQuantity < 0) {
        throw new InsufficientStockError('Insufficient stock.');
      }

      await movementRepo.create({
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        productId: params.productId,
        stockId: stock.id,
        type: params.type,
        quantity: params.quantity,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        performedBy: params.performedBy,
        remarks: params.remarks,
      });

      await stockRepo.updateQuantity(stock.id, newQuantity, Number(stock.reservedQuantity));

      await auditRepo.create({
        organizationId: params.organizationId,
        actorId: params.performedBy,
        action: 'UPDATE',
        entity: 'Stock',
        entityId: stock.id,
        oldValues: { quantity: Number(stock.quantity) },
        newValues: { quantity: newQuantity },
      });
    });
  }

  async adjust(params: {
    organizationId: string;
    warehouseId: string;
    productId: string;
    quantity: number;
    type: StockMovementType;
    performedBy?: string;
    remarks?: string;
  }): Promise<void> {
    await this._unitOfWork.execute(async (tx) => {
      const stockRepo = new StockRepositoryImpl(tx);
      const movementRepo = new StockMovementRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);

      const stock = await stockRepo.findByWarehouseAndProduct(
        params.warehouseId,
        params.productId,
        params.organizationId,
      );

      if (!stock) {
        throw new NotFoundError('Stock not found for warehouse and product.');
      }

      const newQuantity = Number(stock.quantity) + params.quantity;

      await movementRepo.create({
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        productId: params.productId,
        stockId: stock.id,
        type: params.type,
        quantity: params.quantity,
        performedBy: params.performedBy,
        remarks: params.remarks,
      });

      await stockRepo.updateQuantity(stock.id, newQuantity, Number(stock.reservedQuantity));

      await auditRepo.create({
        organizationId: params.organizationId,
        actorId: params.performedBy,
        action: 'UPDATE',
        entity: 'Stock',
        entityId: stock.id,
        oldValues: { quantity: Number(stock.quantity) },
        newValues: { quantity: newQuantity },
      });
    });
  }

  async transfer(params: {
    organizationId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    productId: string;
    quantity: number;
    performedBy?: string;
    remarks?: string;
  }): Promise<void> {
    await this._unitOfWork.execute(async (tx) => {
      const stockRepo = new StockRepositoryImpl(tx);
      const movementRepo = new StockMovementRepositoryImpl(tx);
      const auditRepo = new AuditLogRepositoryImpl(tx);

      const fromStock = await stockRepo.findByWarehouseAndProduct(
        params.fromWarehouseId,
        params.productId,
        params.organizationId,
      );

      if (!fromStock) {
        throw new NotFoundError('Stock not found in source warehouse.');
      }

      if (Number(fromStock.quantity) < params.quantity) {
        throw new InsufficientStockError('Insufficient stock in source warehouse.');
      }

      const toStockId = await stockRepo.createOrGet({
        organizationId: params.organizationId,
        warehouseId: params.toWarehouseId,
        productId: params.productId,
      });

      const toStock = await stockRepo.findById(toStockId, params.organizationId);
      if (!toStock) {
        throw new NotFoundError('Stock not found in destination warehouse.');
      }

      await movementRepo.create({
        organizationId: params.organizationId,
        warehouseId: params.fromWarehouseId,
        productId: params.productId,
        stockId: fromStock.id,
        type: MovementTypes.TRANSFER_OUT,
        quantity: params.quantity,
        performedBy: params.performedBy,
        remarks: params.remarks,
      });

      await movementRepo.create({
        organizationId: params.organizationId,
        warehouseId: params.toWarehouseId,
        productId: params.productId,
        stockId: toStockId,
        type: MovementTypes.TRANSFER_IN,
        quantity: params.quantity,
        performedBy: params.performedBy,
        remarks: params.remarks,
      });

      await stockRepo.updateQuantity(
        fromStock.id,
        Number(fromStock.quantity) - params.quantity,
        Number(fromStock.reservedQuantity),
      );

      await stockRepo.updateQuantity(
        toStockId,
        Number(toStock.quantity) + params.quantity,
        Number(toStock.reservedQuantity),
      );

      await auditRepo.create({
        organizationId: params.organizationId,
        actorId: params.performedBy,
        action: 'UPDATE',
        entity: 'Stock',
        entityId: fromStock.id,
        oldValues: { quantity: Number(fromStock.quantity) },
        newValues: { quantity: Number(fromStock.quantity) - params.quantity },
      });

      await auditRepo.create({
        organizationId: params.organizationId,
        actorId: params.performedBy,
        action: 'UPDATE',
        entity: 'Stock',
        entityId: toStockId,
        oldValues: { quantity: Number(toStock.quantity) },
        newValues: { quantity: Number(toStock.quantity) + params.quantity },
      });
    });
  }

  async getStockLevel(params: {
    organizationId: string;
    warehouseId: string;
    productId: string;
  }): Promise<{ quantity: number; reservedQuantity: number } | null> {
    const stockRepo = new StockRepositoryImpl(this._prisma);
    const stock = await stockRepo.findByWarehouseAndProduct(
      params.warehouseId,
      params.productId,
      params.organizationId,
    );

    if (!stock) return null;

    return {
      quantity: Number(stock.quantity),
      reservedQuantity: Number(stock.reservedQuantity),
    };
  }

  async listStock(params: { organizationId: string; warehouseId: string }): Promise<
    Array<{
      productId: string;
      quantity: number;
      reservedQuantity: number;
    }>
  > {
    const stockRepo = new StockRepositoryImpl(this._prisma);
    const stocks = await stockRepo.findAllByWarehouse(params.warehouseId, params.organizationId);

    return stocks.map((s) => ({
      productId: s.productId,
      quantity: Number(s.quantity),
      reservedQuantity: Number(s.reservedQuantity),
    }));
  }

  async listMovements(params: {
    organizationId: string;
    warehouseId?: string;
    productId?: string;
    type?: string;
    page: number;
    limit: number;
  }) {
    const movementRepo = new StockMovementRepositoryImpl(this._prisma);
    return movementRepo.findAll({
      organizationId: params.organizationId,
      warehouseId: params.warehouseId,
      productId: params.productId,
      type: params.type as StockMovementType,
      page: params.page,
      limit: params.limit,
    });
  }
}
