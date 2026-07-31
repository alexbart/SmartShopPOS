import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Customer Report integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let organizationId: string;
  let warehouseId: string;
  let productId: string;

  beforeAll(async () => {
    app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `CustReportTest-${Date.now()}`,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `custreport-${Date.now()}@example.com`,
        ownerPhone: '+254700000000',
        password: 'StrongPassword123!',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    accessToken = registerBody.data.tokens.accessToken;
    organizationId = registerBody.data.organization.id;

    const branch = await prisma.branch.findFirst({
      where: { organizationId },
      select: { id: true },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId,
        branchId: branch!.id,
        code: `MAIN-${Date.now()}`,
        name: 'Main Warehouse',
        isDefault: true,
      },
    });
    warehouseId = warehouse.id;

    const unit = await prisma.unit.create({
      data: {
        organizationId,
        code: 'BTL',
        name: 'Bottle',
        abbreviation: 'btl',
      },
    });

    const product = await prisma.product.create({
      data: {
        organizationId,
        name: 'Milk 500ml',
        code: `MILK-${Date.now()}`,
        sku: 'SKU001',
        unitId: unit.id,
        costPrice: 50,
        sellingPrice: 100,
        lowStockThreshold: 5,
      },
    });
    productId = product.id;

    await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/receive',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { warehouseId, productId, quantity: 100 },
    });
  });

  it('should return empty customer summary for new organization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/customers',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.items).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
  });

  it('should show customer with multiple purchases', async () => {
    const customer = await prisma.customer.create({
      data: {
        organizationId,
        code: `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: 'John Doe',
        phone: '+254700000001',
        email: `john-${Date.now()}@example.com`,
      },
    });

    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/sales',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          warehouseId,
          customerId: customer.id,
          items: [{ productId, quantity: 2, price: 100 }],
        },
      });
    }

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/customers',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items.length).toBe(1);
    expect(body.data.items[0].name).toBe('John Doe');
    expect(body.data.items[0].transactions).toBe(3);
    expect(body.data.items[0].totalSpent).toBe(600);
    expect(body.data.items[0].averageSale).toBe(200);
    expect(body.data.items[0].lastPurchase).toBeTruthy();
  });

  it('should show customer purchase history', async () => {
    const customer = await prisma.customer.findFirst({
      where: { organizationId, name: 'John Doe' },
      select: { id: true },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/reports/customers/${customer!.id}/purchases`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items.length).toBe(3);
    expect(body.data.items[0].invoiceNumber).toMatch(/^INV-/);
    expect(body.data.items[0].paymentMethod).toBe('CASH');
  });

  it('should filter purchases by date range', async () => {
    const customer = await prisma.customer.findFirst({
      where: { organizationId, name: 'John Doe' },
      select: { id: true },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/reports/customers/${customer!.id}/purchases?from=2020-01-01&to=2020-01-02`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
  });

  it('should return top customers ordered by total spending', async () => {
    const customer2 = await prisma.customer.create({
      data: {
        organizationId,
        code: `CUST2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Jane Doe',
        phone: '+254700000002',
        email: `jane-${Date.now()}@example.com`,
      },
    });

    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/sales',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          warehouseId,
          customerId: customer2.id,
          items: [{ productId, quantity: 2, price: 100 }],
        },
      });
    }

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/customers/top?limit=20',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.length).toBe(2);
    expect(body.data[0].name).toBe('Jane Doe');
    expect(body.data[0].totalSpent).toBe(1000);
    expect(body.data[0].transactions).toBe(5);
    expect(body.data[1].name).toBe('John Doe');
    expect(body.data[1].totalSpent).toBe(600);
  });

  it('should enforce organization isolation', async () => {
    const org2Response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `CustReportIso-${Date.now()}`,
        ownerFirstName: 'Test2',
        ownerLastName: 'User2',
        ownerEmail: `custviso-${Date.now()}@example.com`,
        ownerPhone: '+254700000003',
        password: 'StrongPassword123!',
      },
    });

    const org2Body = JSON.parse(org2Response.body);
    const org2Token = org2Body.data.tokens.accessToken;

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/customers',
      headers: { authorization: `Bearer ${org2Token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
  });

  it('should paginate customer summary', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/customers?page=1&limit=1',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items.length).toBe(1);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(1);
    expect(body.data.pagination.total).toBe(2);
    expect(body.data.pagination.totalPages).toBe(2);
  });
});
