import { PrismaClient } from '@prisma/client';

export async function seedBrands(prisma: PrismaClient, organizationId: string): Promise<void> {
  const brands = [
    { code: 'COCA', name: 'Coca Cola', description: 'Beverages and refreshments' },
    { code: 'PEPSI', name: 'PepsiCo', description: 'Food and beverages' },
    { code: 'UNILEV', name: 'Unilever', description: 'Consumer goods' },
    { code: 'NESTLE', name: 'Nestle', description: 'Food and drink' },
    { code: 'PROCT', name: 'Procter & Gamble', description: 'Consumer goods' },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: {
        organizationId_code: {
          organizationId,
          code: brand.code,
        },
      },
      update: {},
      create: {
        organizationId,
        code: brand.code,
        name: brand.name,
        description: brand.description,
      },
    });
  }
}
