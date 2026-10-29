export interface IPaymentRepository {
  create(_model: CreatePaymentModel): Promise<string>;
  findById(_id: string, _organizationId: string): Promise<PaymentEntity | null>;
  findBySaleId(_saleId: string, _organizationId: string): Promise<PaymentEntity[]>;
  findByIdempotencyKey(_key: string): Promise<PaymentEntity | null>;
  findByDarajaRequestId(_requestId: string): Promise<PaymentEntity | null>;
  getTotalPaidForSale(_saleId: string, _organizationId: string): Promise<number>;
  hasPendingMpesa(_saleId: string, _organizationId: string): Promise<boolean>;
  updateStatus(
    _id: string,
    _status: string,
    _opts?: { paidAt?: Date; darajaTransactionId?: string },
  ): Promise<void>;
}

export interface CreatePaymentModel {
  organizationId: string;
  saleId: string;
  method: string;
  amount: number;
  reference?: string;
  status: string;
  paidAt?: Date;
  idempotencyKey?: string;
  darajaRequestId?: string;
}

export interface PaymentEntity {
  id: string;
  organizationId: string;
  saleId: string;
  method: string;
  amount: number;
  reference?: string;
  status: string;
  paidAt?: Date;
  createdAt: Date;
  idempotencyKey?: string;
  darajaRequestId?: string;
  darajaTransactionId?: string;
}
