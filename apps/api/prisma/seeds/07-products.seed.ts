import { PrismaClient } from '@prisma/client';

export async function seedProducts(prisma: PrismaClient, organizationId: string): Promise<void> {
  const products = [
    {
      code: 'COKE-001',
      name: 'Coca Cola 500ml',
      sku: 'COKE-500ML',
      unitCode: 'BTL',
      taxCode: 'VAT12',
      costPrice: 15.0,
      sellingPrice: 25.0,
    },
    {
      code: 'PEPSI-001',
      name: 'Pepsi 500ml',
      sku: 'PEPSI-500ML',
      unitCode: 'BTL',
      taxCode: 'VAT12',
      costPrice: 14.0,
      sellingPrice: 24.0,
    },
    {
      code: 'BREAD-001',
      name: 'White Bread 500g',
      sku: 'BREAD-500G',
      unitCode: 'PCS',
      taxCode: 'VAT5',
      costPrice: 20.0,
      sellingPrice: 35.0,
    },
    {
      code: 'MILK-001',
      name: 'Full Cream Milk 1L',
      sku: 'MILK-1L',
      unitCode: 'LTR',
      taxCode: 'VAT5',
      costPrice: 35.0,
      sellingPrice: 55.0,
    },
    {
      code: 'RICE-001',
      name: 'Basmati Rice 1kg',
      sku: 'RICE-1KG',
      unitCode: 'KG',
      taxCode: 'VAT5',
      costPrice: 80.0,
      sellingPrice: 120.0,
    },
  ];

  for (const product of products) {
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
        unitId: unit.id,
        taxId: tax?.id,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
      },
    });
  }
}
