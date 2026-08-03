import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael',
  'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan',
  'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher',
  'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret',
  'Mark', 'Sandra', 'Steven', 'Ashley', 'Andrew', 'Kimberly', 'Paul',
];

const LAST_NAMES = [
  'Ochieng', 'Adebayo', 'Mutiso', 'Onyango', 'Wafula', 'Munyua', 'Kariuki',
  'Kamau', 'Omondi', 'Wanjiku', 'Otieno', 'Achieng', 'Okello', 'Nakamura',
  'Sanchez', 'Kim', 'Singh', 'Patel', 'Johnson', 'Williams', 'Brown',
  'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
  'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez',
];

const COMPANY_SUFFIXES = ['Ltd', 'Plaza', 'Stores', 'Enterprises', 'Traders', 'Wholesalers', 'Retailers', 'Supplies'];

const PRODUCT_TEMPLATES: Array<{
  name: string;
  skuPrefix: string;
  price: number;
  costPrice: number;
  unitCode: string;
  categoryCode: string;
  taxCode: string;
  lowStock: number;
}> = [
  { name: 'Coca Cola 500ml', skuPrefix: 'COKE-500', price: 25, costPrice: 15, unitCode: 'BTL', categoryCode: 'BEV', taxCode: 'VAT16', lowStock: 24 },
  { name: 'Pepsi 500ml', skuPrefix: 'PEPSI-500', price: 24, costPrice: 14, unitCode: 'BTL', categoryCode: 'BEV', taxCode: 'VAT16', lowStock: 24 },
  { name: 'Fanta Orange 500ml', skuPrefix: 'FANTA-500', price: 26, costPrice: 15, unitCode: 'BTL', categoryCode: 'BEV', taxCode: 'VAT16', lowStock: 24 },
  { name: 'Sprite 500ml', skuPrefix: 'SPRITE-500', price: 24, costPrice: 14, unitCode: 'BTL', categoryCode: 'BEV', taxCode: 'VAT16', lowStock: 24 },
  { name: 'Water 500ml Bottled', skuPrefix: 'WATER-500', price: 15, costPrice: 8, unitCode: 'BTL', categoryCode: 'BEV', taxCode: 'VAT16', lowStock: 48 },
  { name: 'Kenyan Coffee Beans 250g', skuPrefix: 'COFFEE-250', price: 350, costPrice: 220, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 12 },
  { name: 'Tea Bags 100s', skuPrefix: 'TEA-100', price: 180, costPrice: 120, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 20 },
  { name: 'Sugar 1kg', skuPrefix: 'SUGAR-1K', price: 120, costPrice: 80, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 25 },
  { name: 'Basmati Rice 1kg', skuPrefix: 'RICE-1K', price: 130, costPrice: 90, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 15 },
  { name: 'Ndengu 1kg', skuPrefix: 'NDENGU-1K', price: 145, costPrice: 100, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 15 },
  { name: 'Maize Flour 1kg', skuPrefix: 'FLOUR-1K', price: 110, costPrice: 75, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 30 },
  { name: 'Cooking Oil 1L', skuPrefix: 'OIL-1L', price: 220, costPrice: 150, unitCode: 'LTR', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 10 },
  { name: 'Bread 500g White', skuPrefix: 'BREAD-W500', price: 45, costPrice: 28, unitCode: 'PCS', categoryCode: 'BAK', taxCode: 'EXEMPT', lowStock: 30 },
  { name: 'Bread 500g Brown', skuPrefix: 'BREAD-B500', price: 55, costPrice: 32, unitCode: 'PCS', categoryCode: 'BAK', taxCode: 'EXEMPT', lowStock: 20 },
  { name: 'Sweet Bread Roll', skuPrefix: 'ROLL-SWEET', price: 35, costPrice: 20, unitCode: 'PCS', categoryCode: 'BAK', taxCode: 'EXEMPT', lowStock: 40 },
  { name: 'Milk Powder 500g', skuPrefix: 'MILK-P500', price: 280, costPrice: 180, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 15 },
  { name: 'Full Cream Milk 1L', skuPrefix: 'MILK-1L', price: 65, costPrice: 42, unitCode: 'LTR', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 24 },
  { name: 'Yogurt 500g Natural', skuPrefix: 'YOGURT-500', price: 95, costPrice: 60, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 20 },
  { name: 'Cheese 500g', skuPrefix: 'CHEESE-500', price: 320, costPrice: 210, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 12 },
  { name: 'Eggs 12pcs Free Range', skuPrefix: 'EGG-FREE', price: 320, costPrice: 220, unitCode: 'CRTN', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 20 },
  { name: 'Tomatoes 1kg', skuPrefix: 'TOMATO-1K', price: 90, costPrice: 55, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 30 },
  { name: 'Onions 1kg', skuPrefix: 'ONION-1K', price: 80, costPrice: 45, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 40 },
  { name: 'Potatoes 1kg', skuPrefix: 'POTATO-1K', price: 65, costPrice: 35, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 30 },
  { name: 'Onions 2kg', skuPrefix: 'ONION-2K', price: 150, costPrice: 85, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 20 },
  { name: 'Cooking Salt 1kg', skuPrefix: 'SALT-1K', price: 55, costPrice: 28, unitCode: 'KG', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 30 },
  { name: 'Black Pepper 50g', skuPrefix: 'PEPPER-50', price: 85, costPrice: 55, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 25 },
  { name: 'Turmeric 50g', skuPrefix: 'TURMERIC-50', price: 75, costPrice: 45, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 25 },
  { name: 'Cinnamon 50g', skuPrefix: 'CINNAMON-50', price: 120, costPrice: 80, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 20 },
  { name: 'Green Tea Bags 20s', skuPrefix: 'GREENT-20', price: 150, costPrice: 95, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 30 },
  { name: 'Red Label Tea 100s', skuPrefix: 'REDTEA-100', price: 380, costPrice: 250, unitCode: 'PCS', categoryCode: 'GEN', taxCode: 'EXEMPT', lowStock: 15 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedDemoData(
  prisma: PrismaClient,
  organizationId: string,
  branchId: string,
  ownerId: string,
): Promise<void> {
  const categories = await prisma.category.findMany({
    where: { organizationId },
    select: { id: true, code: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.code, c.id]));

  const units = await prisma.unit.findMany({
    where: { organizationId },
    select: { id: true, code: true },
  });
  const unitMap = new Map(units.map((u) => [u.code, u.id]));

  const taxes = await prisma.tax.findMany({
    where: { organizationId },
    select: { id: true, code: true },
  });
  const taxMap = new Map(taxes.map((t) => [t.code, t.id]));

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId },
    select: { id: true, code: true },
  });

  const defaultWarehouse = warehouses.find((w) => w.code === 'MAIN') ?? warehouses[0];
  const frontWarehouse = warehouses.find((w) => w.code === 'FRONT') ?? warehouses[0];

  const existingCount = await prisma.product.count({ where: { organizationId } });
  if (existingCount >= 50) {
    console.log(`Demo products already seeded (${existingCount} products), skipping product expansion`);
    return;
  }

  console.log(`Seeding demo data: 1000 products, 100 customers, 50 suppliers, 9 employees, 500 sales...`);

  const products: Array<{
    code: string;
    name: string;
    sku: string;
    categoryId: string | null;
    unitId: string;
    taxId: string | null;
    costPrice: number;
    sellingPrice: number;
    lowStockThreshold: number;
  }> = [];

  for (let i = 0; i < 1000; i++) {
    const template = randomChoice(PRODUCT_TEMPLATES);
    const suffix = String(i + 1).padStart(4, '0');
    const variant = randomInt(1, 5);

    products.push({
      code: `${template.skuPrefix}-${suffix}`,
      name: `${template.name} (Variant ${variant})`,
      sku: `${template.skuPrefix}-${suffix}`,
      categoryId: categoryMap.get(template.categoryCode) ?? null,
      unitId: unitMap.get(template.unitCode) ?? unitMap.get('PCS')!,
      taxId: taxMap.get(template.taxCode) ?? null,
      costPrice: template.costPrice,
      sellingPrice: template.price,
      lowStockThreshold: template.lowStock,
    });
  }

  const createdProducts = await prisma.product.createMany({
    data: products.map((p) => ({ ...p, organizationId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${createdProducts.count} products`);

  const allProducts = await prisma.product.findMany({
    where: { organizationId },
    select: { id: true, name: true, categoryId: true, sellingPrice: true, costPrice: true },
  });

  for (const warehouse of warehouses) {
    const batch = 100;
    for (let i = 0; i < allProducts.length; i += batch) {
      const slice = allProducts.slice(i, i + batch);
      await prisma.$transaction(
        slice.map((product) =>
          prisma.stock.upsert({
            where: {
              organizationId_warehouseId_productId: {
                organizationId,
                warehouseId: warehouse.id,
                productId: product.id,
              },
            },
            update: { quantity: randomInt(50, 300) },
            create: {
              organizationId,
              warehouseId: warehouse.id,
              productId: product.id,
              quantity: randomInt(50, 300),
            },
          }),
        ),
      );
    }
  }
  console.log(`  ✓ Updated stock for ${allProducts.length} products across ${warehouses.length} warehouses`);

  const customerNames = new Set<string>();
  const customers: Array<{ code: string; name: string; phone: string; email: string; address: string }> = [];
  let customerCounter = 1;

  while (customerNames.size < 100) {
    const name = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
    if (customerNames.has(name)) continue;
    customerNames.add(name);
    const code = `CUST-${String(customerCounter).padStart(4, '0')}`;
    customerCounter++;
    customers.push({
      code,
      name,
      phone: `+2547${String(randomInt(10000000, 99999999))}`,
      email: `${name.toLowerCase().replace(/\s/g, '.')}@email.com`,
      address: `${randomChoice(['Nairobi', 'Mombasa', 'Kisumu', 'Naivasha', 'Eldoret', 'Thika', 'Kakamega'])}, Kenya`,
    });
  }

  const createdCustomers = await prisma.customer.createMany({
    data: customers.map((c) => ({ ...c, organizationId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${createdCustomers.count} customers`);

  const supplierNames = new Set<string>();
  const suppliers: Array<{ code: string; name: string; contactPerson: string; email: string; phone: string; taxPin: string; paymentTerms: string }> = [];
  let supplierCounter = 1;

  while (supplierNames.size < 50) {
    const person = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
    const companyName = `${person.split(' ')[0]} ${randomChoice(COMPANY_SUFFIXES)}`;
    if (supplierNames.has(companyName)) continue;
    supplierNames.add(companyName);
    const code = `SUP-${String(supplierCounter).padStart(4, '0')}`;
    supplierCounter++;
    suppliers.push({
      code,
      name: companyName,
      contactPerson: person,
      email: `${person.toLowerCase().replace(/\s/g, '.')}@${companyName.toLowerCase().split(' ')[0]}.com`,
      phone: `+2547${String(randomInt(10000000, 99999999))}`,
      taxPin: `P${String(randomInt(100000000, 999999999))}`,
      paymentTerms: randomChoice(['NET30', 'NET15', 'NET7', 'COD']),
    });
  }

  const createdSuppliers = await prisma.supplier.createMany({
    data: suppliers.map((s) => ({ ...s, organizationId })),
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${createdSuppliers.count} suppliers`);

  const managerRoleId = await prisma.role.findFirst({ where: { name: 'MANAGER' }, select: { id: true } });
  const cashierRoleId = await prisma.role.findFirst({ where: { name: 'CASHIER' }, select: { id: true } });

  const employeeNames = new Set<string>();
  const employees: Array<{
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    passwordHash: string;
    roleId: string | null;
  }> = [];

  while (employeeNames.size < 9) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const nameKey = `${firstName}-${lastName}`;
    if (employeeNames.has(nameKey)) continue;
    employeeNames.add(nameKey);
    employees.push({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.com`,
      firstName,
      lastName,
      phone: `+2547${String(randomInt(10000000, 99999999))}`,
      passwordHash: await argon2.hash('SmartShop123!'),
      roleId: randomInt(1, 100) <= 70 ? cashierRoleId?.id ?? null : managerRoleId?.id ?? null,
    });
  }

  const allCustomers = await prisma.customer.findMany({
    where: { organizationId },
    select: { id: true },
  });

  const allWarehouses = await prisma.warehouse.findMany({
    where: { organizationId },
    select: { id: true },
  });

  for (let i = 0; i < 9; i++) {
    const emp = employees[i];
    const existingUser = await prisma.user.findFirst({
      where: { organizationId, email: emp.email },
      select: { id: true },
    });
    if (existingUser) continue;

    await prisma.user.create({
      data: {
        organizationId,
        branchId,
        email: emp.email,
        firstName: emp.firstName,
        lastName: emp.lastName,
        phone: emp.phone,
        passwordHash: emp.passwordHash,
        status: 'ACTIVE',
        roles: {
          create: emp.roleId ? [{ roleId: emp.roleId }] : [],
        },
      },
    });
  }
  console.log(`  ✓ Created ${employees.length} employees`);

  const allUsers = await prisma.user.findMany({
    where: { organizationId, status: 'ACTIVE' },
    select: { id: true },
  });

  const existingSales = await prisma.sale.count({ where: { organizationId } });
  if (existingSales >= 50) {
    console.log(`Existing sales found (${existingSales}), skipping sale generation`);
    return;
  }

  const saleNumberPrefix = 'POS';
  const today = new Date();

  for (let i = 0; i < 500; i++) {
    const saleDate = new Date(today);
    saleDate.setDate(saleDate.getDate() - randomInt(0, 90));

    const itemCount = randomInt(1, 8);
    const selectedItems = [];
    const usedProducts = new Set<string>();

    while (selectedItems.length < itemCount && usedProducts.size < allProducts.length) {
      const product = allProducts[randomInt(0, allProducts.length - 1)];
      if (usedProducts.has(product.id)) continue;
      usedProducts.add(product.id);

      const qty = randomInt(1, 5);
      selectedItems.push({
        productId: product.id,
        quantity: qty,
        price: Number(product.sellingPrice),
        discount: randomInt(0, 5) > 3 ? randomInt(5, 20) : 0,
        tax: randomInt(0, 5) > 3 ? Number(product.sellingPrice) * 0.16 : 0,
        subtotal: Number(product.sellingPrice) * qty,
      });
    }

    if (selectedItems.length === 0) continue;

    const subtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = randomInt(0, 100) > 70 ? randomInt(5, 15) : 0;
    const tax = selectedItems.reduce((sum, item) => sum + item.tax, 0);
    const total = Math.max(subtotal - discount + tax, 0);
    const saleNumber = `${saleNumberPrefix}-${String(i + 1).padStart(6, '0')}`;

    const customer = allCustomers.length > 0
      ? allCustomers[randomInt(0, allCustomers.length - 1)]
      : null;

    const warehouse = allWarehouses[randomInt(0, allWarehouses.length - 1)];
    const cashier = allUsers[randomInt(0, allUsers.length - 1)];

    const paymentMethods: Array<'CASH' | 'CARD' | 'MPESA' | 'BANK' | 'CREDIT'> = ['CASH', 'CARD', 'MPESA', 'BANK', 'CREDIT'];
    const method = randomChoice(paymentMethods);

    try {
      await prisma.sale.create({
        data: {
          organizationId,
          number: saleNumber,
          customerId: customer?.id ?? null,
          warehouseId: warehouse.id,
          cashierId: cashier.id,
          subtotal: subtotal,
          discount: discount,
          tax: tax,
          total: total,
          status: 'COMPLETED',
          createdAt: saleDate,
          updatedAt: saleDate,
          items: {
            create: selectedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              tax: item.tax,
              subtotal: item.subtotal,
            })),
          },
          payments: {
            create: [
              {
                organizationId,
                method: method,
                amount: total,
                status: 'PAID',
                paidAt: saleDate,
              },
            ],
          },
          receipts: {
            create: [
              {
                organizationId,
                number: `RCPT-${saleNumber}`,
                issuedAt: saleDate,
              },
            ],
          },
        },
      });
    } catch (e: any) {
      if (e.code !== 'P2002') throw e;
    }
  }
  console.log(`  ✓ Created 500 sales`);

  const existingDrawer = await prisma.cashDrawer.findFirst({
    where: { organizationId },
    select: { id: true },
  });

  const cashDrawer = existingDrawer ?? await prisma.cashDrawer.create({
    data: {
      organizationId,
      branchId,
      name: 'Main Cash Drawer',
      isActive: true,
    },
  });

  const session = await prisma.cashDrawerSession.create({
    data: {
      organizationId,
      cashDrawerId: cashDrawer.id,
      openedBy: ownerId,
      openingFloat: 500.0,
      status: 'OPEN',
      openedAt: new Date(),
    },
  });

  await prisma.cashMovement.create({
    data: {
      organizationId,
      sessionId: session.id,
      type: 'OPENING_FLOAT',
      amount: 500.0,
      performedBy: ownerId,
      notes: 'Opening cash drawer float',
    },
  });

  await prisma.cashMovement.create({
    data: {
      organizationId,
      sessionId: session.id,
      type: 'SALE',
      amount: 25000.0,
      performedBy: ownerId,
      notes: '500 sales totaling KES 25,000',
    },
  });

  console.log('Demo data seeding complete!');
}
