export interface IReceiptRepository {
  create(_model: CreateReceiptModel): Promise<string>;
  findById(_id: string, _organizationId: string): Promise<ReceiptEntity | null>;
  findByNumber(_number: string, _organizationId: string): Promise<ReceiptEntity | null>;
  findBySaleId(_saleId: string, _organizationId: string): Promise<ReceiptEntity | null>;
}

export interface CreateReceiptModel {
  organizationId: string;
  saleId: string;
  number: string;
  issuedAt: Date;
}

export interface ReceiptEntity {
  id: string;
  organizationId: string;
  saleId: string;
  number: string;
  issuedAt: Date;
  createdAt: Date;
}
