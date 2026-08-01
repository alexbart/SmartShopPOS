import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { seedCategories } from './seeds/03-categories.seed.js';
import { seedBrands } from './seeds/04-brands.seed.js';
import { seedUnits } from './seeds/05-units.seed.js';
import { seedTaxes } from './seeds/06-taxes.seed.js';
import { seedProducts } from './seeds/07-products.seed.js';
import { seedWarehouses, seedSuppliers } from './seeds/08-warehouses.seed.js';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'OWNER', description: 'Full organization access' },
    { name: 'MANAGER', description: 'Branch management access' },
    { name: 'CASHIER', description: 'POS and sales access' },
    { name: 'INVENTORY', description: 'Inventory management access' },
    { name: 'ACCOUNTANT', description: 'Financial access' },
  ];

  const permissions = [
    { name: 'AUTH.LOGIN', module: 'AUTH', description: 'Login to system' },
    { name: 'AUTH.LOGOUT', module: 'AUTH', description: 'Logout from system' },
    { name: 'AUTH.REGISTER', module: 'AUTH', description: 'Register organization' },
    { name: 'USER.READ', module: 'USER', description: 'Read users' },
    { name: 'USER.CREATE', module: 'USER', description: 'Create users' },
    { name: 'USER.UPDATE', module: 'USER', description: 'Update users' },
    { name: 'CUSTOMER.VIEW', module: 'CUSTOMER', description: 'View customers' },
    { name: 'CUSTOMER.CREATE', module: 'CUSTOMER', description: 'Create customers' },
    { name: 'CUSTOMER.UPDATE', module: 'CUSTOMER', description: 'Update customers' },
    { name: 'SALE.CREATE', module: 'SALE', description: 'Create sales' },
    { name: 'SALE.VIEW', module: 'SALE', description: 'View sales' },
    { name: 'SALE.VOID', module: 'SALE', description: 'Void sales' },
    { name: 'PAYMENT.CREATE', module: 'PAYMENT', description: 'Process payments' },
    { name: 'RECEIPT.PRINT', module: 'RECEIPT', description: 'Print receipts' },
  ];

  const rolePermissions: Record<string, string[]> = {
    OWNER: permissions.map((p) => p.name),
    MANAGER: ['USER.READ', 'USER.UPDATE', 'SALE.CREATE', 'SALE.VIEW', 'PAYMENT.CREATE'],
    CASHIER: [
      'AUTH.LOGIN',
      'AUTH.LOGOUT',
      'SALE.CREATE',
      'SALE.VIEW',
      'PAYMENT.CREATE',
      'RECEIPT.PRINT',
    ],
  };

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });
  }

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: {
        name: permission.name,
        module: permission.module,
        description: permission.description,
      },
    });
  }

  const roleMap = new Map(
    await prisma.role
      .findMany({ select: { id: true, name: true } })
      .then((roles) => roles.map((role) => [role.name, role.id])),
  );

  const permissionMap = new Map(
    await prisma.permission
      .findMany({ select: { id: true, name: true } })
      .then((permissions) => permissions.map((permission) => [permission.name, permission.id])),
  );

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    const existing = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
    const existingPermissionIds = new Set(existing.map((rp) => rp.permissionId));

    const desiredPermissionIds = permissionNames
      .map((name) => permissionMap.get(name))
      .filter((id): id is string => Boolean(id));

    for (const permissionId of desiredPermissionIds) {
      if (!existingPermissionIds.has(permissionId)) {
        await prisma.rolePermission.create({
          data: { roleId, permissionId },
        });
      }
    }
  }

  let organization = await prisma.organization.findFirst();
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Demo Organization',
        code: 'DEMO',
        status: 'ACTIVE',
      },
    });
  }

  const organizationId = organization.id;

  await seedCategories(prisma, organizationId);
  await seedBrands(prisma, organizationId);
  await seedUnits(prisma, organizationId);
  await seedTaxes(prisma, organizationId);
  await seedProducts(prisma, organizationId);

  let branch = await prisma.branch.findFirst({
    where: { organizationId },
    select: { id: true },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        organizationId,
        name: 'Main Branch',
        code: 'MAIN',
        isHeadOffice: true,
      },
    });
  }

  await seedWarehouses(prisma, organizationId, branch.id);
  await seedSuppliers(prisma, organizationId);

  const ownerRoleId = roleMap.get('OWNER');
  const ownerEmail = 'owner@demo.com';
  const passwordHash = await argon2.hash('SmartShop123!');

  const existingUser = await prisma.user.findFirst({
    where: { organizationId, email: ownerEmail },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        organizationId,
        branchId: branch.id,
        email: ownerEmail,
        firstName: 'Demo',
        lastName: 'Owner',
        passwordHash,
        status: 'ACTIVE',
        roles: {
          create: ownerRoleId ? [{ roleId: ownerRoleId }] : [],
        },
      },
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
