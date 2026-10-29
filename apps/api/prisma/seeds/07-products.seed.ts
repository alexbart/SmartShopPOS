import { PrismaClient } from '@prisma/client';

export async function seedProducts(prisma: PrismaClient, organizationId: string): Promise<void> {
  const products = [
    {
      code: 'COKE-001',
      name: 'Coca Cola 500ml',
      sku: 'COKE-500ML',
      categoryCode: 'BEV',
      unitCode: 'BTL',
      taxCode: 'VAT16',
      costPrice: 15.0,
      sellingPrice: 25.0,
    },
    {
      code: 'PEPSI-001',
      name: 'Pepsi 500ml',
      sku: 'PEPSI-500ML',
      categoryCode: 'BEV',
      unitCode: 'BTL',
      taxCode: 'VAT16',
      costPrice: 14.0,
      sellingPrice: 24.0,
    },
    {
      code: 'BREAD-001',
      name: 'White Bread 500g',
      sku: 'BREAD-500G',
      categoryCode: 'BAK',
      unitCode: 'PCS',
      taxCode: 'EXEMPT',
      costPrice: 20.0,
      sellingPrice: 35.0,
    },
    {
      code: 'MILK-001',
      name: 'Full Cream Milk 1L',
      sku: 'MILK-1L',
      categoryCode: 'GEN',
      unitCode: 'LTR',
      taxCode: 'EXEMPT',
      costPrice: 35.0,
      sellingPrice: 55.0,
    },
    {
      code: 'RICE-001',
      name: 'Basmati Rice 1kg',
      sku: 'RICE-1KG',
      categoryCode: 'GEN',
      unitCode: 'KG',
      taxCode: 'EXEMPT',
      costPrice: 80.0,
      sellingPrice: 120.0,
    },
  ];

  for (const product of products) {
    const category = await prisma.category.findFirst({
      where: { organizationId, code: product.categoryCode, deletedAt: null },
      select: { id: true },
    });

    const unit = await prisma.unit.findFirst({
      where: { organizationId, code: product.unitCode, deletedAt: null },
      select: { id: true },
    });

    const tax = await prisma.tax.findFirst({
      where: { organizationId, code: product.taxCode, deletedAt: null },
      select: { id: true },
    });

    if (!unit) {
      console.warn(`Unit ${product.unitCode} not found for product ${product.name}, skipping`);
      continue;
    }

    await prisma.product.upsert({
      where: {
        organizationId_code: {
          organizationId,
          code: product.code,
        },
      },
      update: {
        sku: product.sku,
        categoryId: category?.id ?? null,
        unitId: unit.id,
        taxId: tax?.id,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
      },
      create: {
        organizationId,
        code: product.code,
        name: product.name,
        sku: product.sku,
        categoryId: category?.id ?? null,
        unitId: unit.id,
        taxId: tax?.id,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
      },
    });
  }
}
