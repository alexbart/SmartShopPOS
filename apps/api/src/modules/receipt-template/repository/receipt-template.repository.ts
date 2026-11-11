import type { Prisma } from '@prisma/client';

export interface ReceiptTemplateRecord {
  id: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  sections: Prisma.JsonValue;
  styles: Prisma.JsonValue;
  headerText: string | null;
  footerText: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateReceiptTemplateData {
  organizationId: string;
  name: string;
  isDefault?: boolean;
  sections: Prisma.InputJsonValue;
  styles: Prisma.InputJsonValue;
  headerText?: string | null;
  footerText?: string | null;
}

export type UpdateReceiptTemplateData = Partial<{
  name: string;
  isDefault: boolean;
  sections: Prisma.InputJsonValue;
  styles: Prisma.InputJsonValue;
  headerText: string | null;
  footerText: string | null;
}>;

export interface IReceiptTemplateRepository {
  create(_data: CreateReceiptTemplateData): Promise<ReceiptTemplateRecord>;
  findById(_id: string, _organizationId: string): Promise<ReceiptTemplateRecord | null>;
  findByName(_name: string, _organizationId: string): Promise<ReceiptTemplateRecord | null>;
  findAll(_organizationId: string, _includeDeleted?: boolean): Promise<ReceiptTemplateRecord[]>;
  findDefault(_organizationId: string): Promise<ReceiptTemplateRecord | null>;
  update(
    _id: string,
    _organizationId: string,
    _data: UpdateReceiptTemplateData,
  ): Promise<ReceiptTemplateRecord>;
  setDefault(_id: string, _organizationId: string): Promise<void>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}
