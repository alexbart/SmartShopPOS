import { PrismaClient } from '@prisma/client';

export async function seedTaxes(prisma: PrismaClient, organizationId: string): Promise<void> {
  const taxes = [
    { code: 'VAT0', name: 'Zero Rate', rate: 0 },
    { code: 'VAT5', name: '5% VAT', rate: 5 },
    { code: 'VAT12', name: '12% VAT', rate: 12 },
    { code: 'VAT18', name: '18% VAT', rate: 18 },
  ];

  for (const tax of taxes) {
    await prisma.tax.upsert({
      where: {
        organizationId_code: {
          organizationId,
          code: tax.code,
        },
      },
      update: {},
      create: {
        organizationId,
        code: tax.code,
        name: tax.name,
        rate: tax.rate,
      },
    });
  }
}
