import { PrismaClient } from '@prisma/client';

export async function seedWarehouses(
  prisma: PrismaClient,
  organizationId: string,
  branchId: string,
): Promise<void> {
  const warehouses = [
    { code: 'MAIN', name: 'Main Warehouse', isDefault: true },
    { code: 'FRONT', name: 'Front Store', isDefault: false },
    { code: 'COLD', name: 'Cold Storage', isDefault: false },
  ];

  for (const warehouse of warehouses) {
    await prisma.warehouse.upsert({
      where: {
        organizationId_code: {
          organizationId,
          code: warehouse.code,
        },
      },
      update: {},
      create: {
        organizationId,
        branchId,
        code: warehouse.code,
        name: warehouse.name,
        isDefault: warehouse.isDefault,
      },
    });
  }
}

export async function seedSuppliers(prisma: PrismaClient, organizationId: string): Promise<void> {
  const suppliers = [
    {
      code: 'SUP001',
      name: 'ABC Supplies Ltd',
      contactPerson: 'John Doe',
      email: 'john@abcsupplies.com',
      phone: '+254700000001',
      taxPin: 'P123456789',
      paymentTerms: 'NET30',
    },
    {
      code: 'SUP002',
      name: 'XYZ Distributors',
      contactPerson: 'Jane Smith',
      email: 'jane@xyzdist.com',
      phone: '+254700000002',
      taxPin: 'P987654321',
      paymentTerms: 'NET15',
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: {
        organizationId_code: {
          organizationId,
          code: supplier.code,
        },
      },
      update: {},
      create: {
        organizationId,
        code: supplier.code,
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        taxPin: supplier.taxPin,
        paymentTerms: supplier.paymentTerms,
      },
    });
  }
}
