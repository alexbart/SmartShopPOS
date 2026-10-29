import { PrismaClient } from '@prisma/client';

export async function seedUnits(prisma: PrismaClient, organizationId: string): Promise<void> {
  const units = [
    { code: 'PCS', name: 'Piece', abbreviation: 'pc' },
    { code: 'KG', name: 'Kilogram', abbreviation: 'kg' },
    { code: 'GM', name: 'Gram', abbreviation: 'g' },
    { code: 'LTR', name: 'Liter', abbreviation: 'l' },
    { code: 'MTR', name: 'Meter', abbreviation: 'm' },
    { code: 'BX', name: 'Box', abbreviation: 'bx' },
    { code: 'PKT', name: 'Packet', abbreviation: 'pkt' },
    { code: 'BTL', name: 'Bottle', abbreviation: 'btl' },
    { code: 'DOZ', name: 'Dozen', abbreviation: 'doz' },
    { code: 'SET', name: 'Set', abbreviation: 'set' },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: {
        organizationId_code: {
          organizationId,
          code: unit.code,
        },
      },
      update: {},
      create: {
        organizationId,
        code: unit.code,
        name: unit.name,
        abbreviation: unit.abbreviation,
      },
    });
  }
}
