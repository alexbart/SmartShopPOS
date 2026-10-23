import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { organizationId: '6458f171-0ba2-4aff-a6bd-c1278066e399', deletedAt: null },
    select: { id: true }
  });
  
  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: '6458f171-0ba2-4aff-a6bd-c1278066e399', deletedAt: null },
    select: { id: true }
  });
  
  if (warehouses.length === 0) {
    console.log('No warehouses found');
    return;
  }
  
  const defaultWarehouse = warehouses[0].id;
  
  for (const p of products) {
    const stock = await prisma.stock.findFirst({
      where: { productId: p.id, warehouseId: defaultWarehouse }
    });
    
    if (stock) {
      await prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: 100 }
      });
    } else {
      await prisma.stock.create({
        data: {
          organizationId: '6458f171-0ba2-4aff-a6bd-c1278066e399',
          warehouseId: defaultWarehouse,
          productId: p.id,
          quantity: 100
        }
      });
    }
  }
  
  await prisma.product.updateMany({
    where: { organizationId: '6458f171-0ba2-4aff-a6bd-c1278066e399' },
    data: { lowStockThreshold: 10 }
  });
  
  console.log('Updated', products.length, 'products with stock=100 and threshold=10');
}

main().catch(console.error).finally(() => prisma.$disconnect());