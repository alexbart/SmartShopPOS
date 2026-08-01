export const PurchaseOrderStatuses = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatuses)[keyof typeof PurchaseOrderStatuses];

export interface CreatePurchaseOrderItemCommand {
  productId: string;
  quantity: number;
  unitCost: number;
  discount?: number;
  tax?: number;
}

export interface CreatePurchaseOrderCommand {
  organizationId: string;
  branchId: string;
  warehouseId: string;
  supplierId: string;
  items: CreatePurchaseOrderItemCommand[];
  expectedDeliveryDate?: Date;
  discount?: number;
  tax?: number;
  notes?: string;
  createdBy: string;
}

export interface UpdatePurchaseOrderCommand {
  id: string;
  organizationId: string;
  createdBy: string;
  items?: CreatePurchaseOrderItemCommand[];
  expectedDeliveryDate?: Date;
  discount?: number;
  tax?: number;
  notes?: string;
}

export interface ReceiveGoodItemCommand {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface ReceiveGoodsCommand {
  purchaseOrderId: string;
  organizationId: string;
  warehouseId: string;
  items: ReceiveGoodItemCommand[];
  createdBy: string;
  notes?: string;
}

export interface CreatePurchaseOrderModel {
  organizationId: string;
  branchId: string;
  warehouseId: string;
  supplierId: string;
  orderNumber: string;
  expectedDeliveryDate?: Date;
  items: CreatePurchaseOrderItemModel[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  totalQuantity: number;
  receivedQuantity: number;
  notes?: string;
  createdBy: string;
  status: string;
}

export interface CreatePurchaseOrderItemModel {
  productId: string;
  quantity: number;
  unitCost: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface PurchaseOrderItemEntity {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface PurchaseOrderEntity {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  supplierId: string;
  orderNumber: string;
  status: string;
  expectedDeliveryDate?: Date;
  receivedQuantity: number;
  totalQuantity: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  items: PurchaseOrderItemEntity[];
}

export interface IPurchaseOrderRepository {
  // eslint-disable-next-line no-unused-vars
  create(model: CreatePurchaseOrderModel): Promise<string>;
  // eslint-disable-next-line no-unused-vars
  findById(_id: string, _organizationId: string): Promise<PurchaseOrderEntity | null>;
  // eslint-disable-next-line no-unused-vars
  list(
    _organizationId: string,
    _page?: number,
    _limit?: number,
  ): Promise<{ items: PurchaseOrderEntity[]; total: number; page: number; limit: number }>;
  findByNumber(_number: string, _organizationId: string): Promise<PurchaseOrderEntity | null>;
  update(
    _id: string,
    _model: Partial<UpdatePurchaseOrderModel>,
  ): Promise<PurchaseOrderEntity | null>;
  updateStatus(_id: string, _status: string): Promise<void>;
  updateReceivedQuantity(
    _id: string,
    _receivedQuantity: number,
    _totalQuantity: number,
  ): Promise<void>;
}

export interface UpdatePurchaseOrderModel {
  expectedDeliveryDate?: Date;
  items?: CreatePurchaseOrderItemModel[];
  discount?: number;
  tax?: number;
  notes?: string;
}
