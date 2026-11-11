import { PrismaClient, Prisma } from '@prisma/client';
import type { IReceiptTemplateRepository } from './receipt-template.repository.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/business-error.js';

export class ReceiptTemplateRepositoryImpl implements IReceiptTemplateRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async create(data: {
    organizationId: string;
    name: string;
    isDefault?: boolean;
    sections: Prisma.InputJsonValue;
    styles: Prisma.InputJsonValue;
    headerText?: string | null;
    footerText?: string | null;
  }) {
    const existing = await this._prisma.receiptTemplate.findFirst({
      where: {
        organizationId: data.organizationId,
        name: data.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictError('A template with this name already exists for this organization.');
    }

    if (data.isDefault) {
      await this._prisma.receiptTemplate.updateMany({
        where: {
          organizationId: data.organizationId,
          isDefault: true,
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    return this._prisma.receiptTemplate.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        isDefault: data.isDefault ?? false,
        sections: data.sections,
        styles: data.styles,
        headerText: data.headerText ?? null,
        footerText: data.footerText ?? null,
      },
    });
  }

  async findById(id: string, organizationId: string) {
    return this._prisma.receiptTemplate.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findByName(name: string, organizationId: string) {
    return this._prisma.receiptTemplate.findFirst({
      where: {
        name,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async findAll(organizationId: string, includeDeleted = false) {
    return this._prisma.receiptTemplate.findMany({
      where: {
        organizationId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async findDefault(organizationId: string) {
    return this._prisma.receiptTemplate.findFirst({
      where: {
        organizationId,
        isDefault: true,
        deletedAt: null,
      },
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: Partial<{
      name: string;
      isDefault: boolean;
      sections: Prisma.InputJsonValue;
      styles: Prisma.InputJsonValue;
      headerText: string | null;
      footerText: string | null;
    }>,
  ) {
    const existing = await this.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundError('Receipt template not found.');
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await this.findByName(data.name, organizationId);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError('A template with this name already exists for this organization.');
      }
    }

    if (data.isDefault === true) {
      await this._prisma.receiptTemplate.updateMany({
        where: {
          organizationId,
          isDefault: true,
          deletedAt: null,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    return this._prisma.receiptTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async setDefault(id: string, organizationId: string) {
    await this._prisma.$transaction(async (tx) => {
      await tx.receiptTemplate.updateMany({
        where: {
          organizationId,
          isDefault: true,
          deletedAt: null,
          NOT: { id },
        },
        data: { isDefault: false },
      });

      await tx.receiptTemplate.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }

  async softDelete(id: string, organizationId: string) {
    const existing = await this.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundError('Receipt template not found.');
    }

    if (existing.isDefault) {
      throw new ConflictError(
        'Cannot delete the default template. Set another template as default first.',
      );
    }

    await this._prisma.receiptTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
