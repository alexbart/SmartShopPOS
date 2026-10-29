import { DomainEventBase } from '../events/event-bus.js';

export class SaleCreatedEvent extends DomainEventBase {
  readonly saleId: string;
  readonly organizationId: string;
  readonly total: number;
  readonly items: Array<{ productId: string; quantity: number; price: number }>;

  constructor(
    saleId: string,
    organizationId: string,
    total: number,
    items: Array<{ productId: string; quantity: number; price: number }>,
  ) {
    super();
    this.saleId = saleId;
    this.organizationId = organizationId;
    this.total = total;
    this.items = items;
  }
}

export class SaleVoidedEvent extends DomainEventBase {
  readonly saleId: string;
  readonly organizationId: string;
  readonly items: Array<{ productId: string; quantity: number }>;

  constructor(
    saleId: string,
    organizationId: string,
    items: Array<{ productId: string; quantity: number }>,
  ) {
    super();
    this.saleId = saleId;
    this.organizationId = organizationId;
    this.items = items;
  }
}

export class PaymentReceivedEvent extends DomainEventBase {
  readonly paymentId: string;
  readonly saleId: string;
  readonly organizationId: string;
  readonly amount: number;
  readonly method: string;

  constructor(
    paymentId: string,
    saleId: string,
    organizationId: string,
    amount: number,
    method: string,
  ) {
    super();
    this.paymentId = paymentId;
    this.saleId = saleId;
    this.organizationId = organizationId;
    this.amount = amount;
    this.method = method;
  }
}

export class StockLevelChangedEvent extends DomainEventBase {
  readonly warehouseId: string;
  readonly productId: string;
  readonly organizationId: string;
  readonly oldQuantity: number;
  readonly newQuantity: number;
  readonly movementType: string;

  constructor(
    warehouseId: string,
    productId: string,
    organizationId: string,
    oldQuantity: number,
    newQuantity: number,
    movementType: string,
  ) {
    super();
    this.warehouseId = warehouseId;
    this.productId = productId;
    this.organizationId = organizationId;
    this.oldQuantity = oldQuantity;
    this.newQuantity = newQuantity;
    this.movementType = movementType;
  }
}
