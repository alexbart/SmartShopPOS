import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../database/prisma.js';

export class NumberSequenceService {
  constructor(private readonly _prisma: PrismaClient = getPrisma()) {}

  async next(entityType: string, organizationId: string): Promise<string> {
    const prefixMap: Record<string, string> = {
      SALE: 'INV',
      RECEIPT: 'RCPT',
      PURCHASE_ORDER: 'PO',
      GOODS_RECEIPT: 'GRN',
      STOCK_TRANSFER: 'TRF',
      STOCK_ADJUSTMENT: 'ADJ',
    };

    const prefix = prefixMap[entityType] ?? entityType.substring(0, 4).toUpperCase();
    const today = new Date();
    const datePart = `${String(today.getFullYear()).slice(2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const sequence = await this._prisma.numberSequence.upsert({
      where: {
        organizationId_entityType: {
          organizationId,
          entityType,
        },
      },
      update: {
        lastNumber: { increment: 1 },
      },
      create: {
        organizationId,
        entityType,
        prefix,
        lastNumber: 1,
      },
      select: { lastNumber: true },
    });

    const numberPart = String(sequence.lastNumber).padStart(6, '0');
    return `${prefix}-${datePart}-${numberPart}`;
  }
}
