import { PrismaClient } from '@prisma/client';

export async function seedTaxes(prisma: PrismaClient, organizationId: string): Promise<void> {
  const taxes = [
    { code: 'VAT16', name: 'Standard Rate (16%)', rate: 16 },
    { code: 'VAT8', name: 'Petroleum Levy (8%)', rate: 8 },
    { code: 'VAT0', name: 'Zero Rated (0%)', rate: 0 },
    { code: 'EXEMPT', name: 'Exempt', rate: 0 },
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
