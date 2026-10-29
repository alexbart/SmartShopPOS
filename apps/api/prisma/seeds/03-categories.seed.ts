import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient, organizationId: string): Promise<void> {
  const categories = [
    { code: 'GEN', name: 'General', description: 'General category' },
    { code: 'BEV', name: 'Beverages', description: 'Beverages and drinks' },
    { code: 'BAK', name: 'Bakery', description: 'Bakery and bread' },
    { code: 'ELC', name: 'Electronics', description: 'Electronic goods' },
    { code: 'HSE', name: 'Household', description: 'Household items' },
    { code: 'STN', name: 'Stationery', description: 'Office and school supplies' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        organizationId_code: {
          organizationId,
          code: category.code,
        },
      },
      update: {},
      create: {
        organizationId,
        code: category.code,
        name: category.name,
        description: category.description,
      },
    });
  }
}
