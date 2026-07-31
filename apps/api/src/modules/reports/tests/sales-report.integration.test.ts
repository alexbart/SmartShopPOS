import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Sales Report integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let warehouseId: string;
  let productId: string;

  beforeAll(async () => {
    app = await buildApp();

    const orgName = `ReportTest-${Date.now()}`;
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: orgName,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `reporttest-${Date.now()}@example.com`,
        ownerPhone: '+254700000000',
        password: 'StrongPassword123!',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    accessToken = registerBody.data.tokens.accessToken;

    const org = await prisma.organization.findFirst({
      where: { name: orgName },
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
    warehouseId = warehouse.id;

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
    productId = product.id;

    await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/receive',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { warehouseId, productId, quantity: 100 },
    });
  });

  it('should return empty report for empty database', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/sales',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.summary.sales).toBe(0);
    expect(body.data.summary.grossRevenue).toBe(0);
    expect(body.data.items).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
  });

  it('should reflect sales after creating them', async () => {
    for (let i = 0; i < 3; i++) {
      const saleResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/sales',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          warehouseId,
          items: [{ productId, quantity: 2, price: 100 }],
        },
      });
      expect(saleResponse.statusCode).toBe(201);
    }

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/sales',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.summary.sales).toBe(3);
    expect(body.data.summary.grossRevenue).toBe(600);
    expect(body.data.items.length).toBe(3);
    expect(body.data.pagination.total).toBe(3);
  });

  it('should filter by date range', async () => {
    const fromResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/sales',
      headers: { authorization: `Bearer ${accessToken}` },
      query: { from: '2020-01-01', to: '2020-01-02' },
    });

    expect(fromResponse.statusCode).toBe(200);
    const fromBody = JSON.parse(fromResponse.body);
    expect(fromBody.data.summary.sales).toBe(0);
  });

  it('should filter by payment method', async () => {
    const cashResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/sales',
      headers: { authorization: `Bearer ${accessToken}` },
      query: { paymentMethod: 'CASH' },
    });

    expect(cashResponse.statusCode).toBe(200);
    const cashBody = JSON.parse(cashResponse.body);
    expect(cashBody.data.summary.sales).toBe(3);
  });

  it('should enforce organization isolation', async () => {
    const org2Response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `ReportIsolation-${Date.now()}`,
        ownerFirstName: 'Test2',
        ownerLastName: 'User2',
        ownerEmail: `reportiso-${Date.now()}@example.com`,
        ownerPhone: '+254700000002',
        password: 'StrongPassword123!',
      },
    });

    const org2Body = JSON.parse(org2Response.body);
    const org2Token = org2Body.data.tokens.accessToken;

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/sales',
      headers: { authorization: `Bearer ${org2Token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.summary.sales).toBe(0);
    expect(body.data.items).toEqual([]);
  });

  it('should paginate correctly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/sales',
      headers: { authorization: `Bearer ${accessToken}` },
      query: { page: '1', limit: '2' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items.length).toBe(2);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(2);
    expect(body.data.pagination.total).toBe(3);
    expect(body.data.pagination.totalPages).toBe(2);
  });
});
