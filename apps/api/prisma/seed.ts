import { PrismaClient } from '@prisma/client';

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
  ];

  const rolePermissions: Record<string, string[]> = {
    OWNER: permissions.map((p) => p.name),
    MANAGER: ['USER.READ', 'USER.UPDATE'],
    CASHIER: ['AUTH.LOGIN', 'AUTH.LOGOUT'],
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
