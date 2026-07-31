export interface IPaymentRepository {
  create(_model: CreatePaymentModel): Promise<string>;
  findById(_id: string, _organizationId: string): Promise<PaymentEntity | null>;
  findBySaleId(_saleId: string, _organizationId: string): Promise<PaymentEntity[]>;
  getTotalForSale(_saleId: string): Promise<number>;
}

export interface CreatePaymentModel {
  organizationId: string;
  saleId: string;
  method: string;
  amount: number;
  reference?: string;
  status: string;
  paidAt?: Date;
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
}
