import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Dashboard integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;

  beforeAll(async () => {
    app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `DashboardTest-${Date.now()}`,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `dashboardtest-${Date.now()}@example.com`,
        ownerPhone: '+254700000000',
        password: 'StrongPassword123!',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    accessToken = registerBody.data.tokens.accessToken;
  });

  it('should return zeros and empty arrays for empty database', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.today.sales).toBe(0);
    expect(body.data.today.transactions).toBe(0);
    expect(body.data.today.customers).toBe(0);
    expect(body.data.inventory.lowStock).toBe(0);
    expect(body.data.inventory.outOfStock).toBe(0);
    expect(body.data.topProducts).toEqual([]);
    expect(body.data.recentSales).toEqual([]);
  });

  it('should reflect today sales after creating a sale', async () => {
    const org = await prisma.organization.findFirst({
      where: { name: { startsWith: 'DashboardTest-' } },
      select: { id: true },
    });
    const branch = await prisma.branch.findFirst({
      where: { organizationId: org!.id },
      select: { id: true },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: org!.id,
        branchId: branch!.id,
        code: 'MAIN',
        name: 'Main Warehouse',
        isDefault: true,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        organizationId: org!.id,
        code: 'TEST',
        name: 'Test Unit',
        abbreviation: 'tu',
      },
    });

    const product = await prisma.product.create({
      data: {
        organizationId: org!.id,
        name: 'Test Product',
        code: 'TP001',
        unitId: unit.id,
        costPrice: 50,
        sellingPrice: 100,
        lowStockThreshold: 5,
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/receive',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId: warehouse.id,
        productId: product.id,
        quantity: 10,
      },
    });

    const saleResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId: warehouse.id,
        items: [{ productId: product.id, quantity: 2, price: 100 }],
      },
    });

    expect(saleResponse.statusCode).toBe(201);

    const dashboardResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(dashboardResponse.statusCode).toBe(200);
    const dashboardBody = JSON.parse(dashboardResponse.body);
    expect(dashboardBody.data.today.sales).toBe(200);
    expect(dashboardBody.data.today.transactions).toBe(1);
    expect(dashboardBody.data.recentSales.length).toBe(1);
    expect(dashboardBody.data.recentSales[0].saleNumber).toMatch(/^INV-/);
    expect(dashboardBody.data.topProducts.length).toBe(1);
    expect(dashboardBody.data.topProducts[0].quantitySold).toBe(2);
  });

  it('should show low stock and out of stock products', async () => {
    const org = await prisma.organization.findFirst({
      where: { name: { startsWith: 'DashboardTest-' } },
      select: { id: true },
    });
    const branch = await prisma.branch.findFirst({
      where: { organizationId: org!.id },
      select: { id: true },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: org!.id,
        branchId: branch!.id,
        code: 'LOW',
        name: 'Low Stock Warehouse',
        isDefault: false,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        organizationId: org!.id,
        code: 'LOW_UNIT',
        name: 'Low Stock Unit',
        abbreviation: 'ls',
      },
    });

    const lowStockProduct = await prisma.product.create({
      data: {
        organizationId: org!.id,
        name: 'Low Stock Product',
        code: 'LSP001',
        unitId: unit.id,
        costPrice: 10,
        sellingPrice: 20,
        lowStockThreshold: 5,
      },
    });

    const outOfStockProduct = await prisma.product.create({
      data: {
        organizationId: org!.id,
        name: 'Out of Stock Product',
        code: 'OSP001',
        unitId: unit.id,
        costPrice: 10,
        sellingPrice: 20,
        lowStockThreshold: 5,
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/receive',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId: warehouse.id,
        productId: lowStockProduct.id,
        quantity: 3,
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/receive',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId: warehouse.id,
        productId: outOfStockProduct.id,
        quantity: 0,
      },
    });

    const dashboardResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(dashboardResponse.statusCode).toBe(200);
    const dashboardBody = JSON.parse(dashboardResponse.body);
    expect(dashboardBody.data.inventory.lowStock).toBeGreaterThanOrEqual(1);
    expect(dashboardBody.data.inventory.outOfStock).toBeGreaterThanOrEqual(1);
  });

  it('should enforce organization isolation', async () => {
    const org2Response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `IsolationTest-${Date.now()}`,
        ownerFirstName: 'Test2',
        ownerLastName: 'User2',
        ownerEmail: `isolationtest-${Date.now()}@example.com`,
        ownerPhone: '+254700000001',
        password: 'StrongPassword123!',
      },
    });

    const org2Body = JSON.parse(org2Response.body);
    const org2Token = org2Body.data.tokens.accessToken;

    const dashboardResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      headers: { authorization: `Bearer ${org2Token}` },
    });

    expect(dashboardResponse.statusCode).toBe(200);
    const dashboardBody = JSON.parse(dashboardResponse.body);
    expect(dashboardBody.data.today.sales).toBe(0);
    expect(dashboardBody.data.today.transactions).toBe(0);
    expect(dashboardBody.data.recentSales).toEqual([]);
  });
});
