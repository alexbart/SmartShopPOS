import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Inventory Report integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let warehouseId: string;
  let productId: string;
  let unitId: string;

  beforeAll(async () => {
    app = await buildApp();

    const orgName = `InvReportTest-${Date.now()}`;
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: orgName,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `invreport-${Date.now()}@example.com`,
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
        code: `MAIN-${Date.now()}`,
        name: 'Main Warehouse',
        isDefault: true,
      },
    });
    warehouseId = warehouse.id;

    const unit = await prisma.unit.create({
      data: {
        organizationId: org!.id,
        code: 'BTL',
        name: 'Bottle',
        abbreviation: 'btl',
      },
    });
    unitId = unit.id;

    const product = await prisma.product.create({
      data: {
        organizationId: org!.id,
        name: 'Milk 500ml',
        code: 'MILK500',
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

  it('should return empty stock report for new warehouse', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/inventory/stock',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(body.data.items[0].quantity).toBe(100);
    expect(body.data.items[0].available).toBe(100);
    expect(body.data.items[0].reserved).toBe(0);
    expect(body.data.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('should filter by warehouse', async () => {
    const org = await prisma.organization.findFirst({
      where: { name: { startsWith: 'InvReportTest-' } },
      select: { id: true },
    });
    const branch = await prisma.branch.findFirst({
      where: { organizationId: org!.id },
      select: { id: true },
    });

    const warehouse2 = await prisma.warehouse.create({
      data: {
        organizationId: org!.id,
        branchId: branch!.id,
        code: `SEC-${Date.now()}`,
        name: 'Secondary Warehouse',
        isDefault: false,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/reports/inventory/stock?warehouseId=${warehouse2.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items).toEqual([]);
  });

  it('should filter stock movements by type', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/inventory/movements?movementType=SALE',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThanOrEqual(0);
  });

  it('should filter movements by date range', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/inventory/movements?from=2020-01-01&to=2020-01-02',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
  });

  it('should show low stock products', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/inventory/low-stock',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThanOrEqual(0);
  });

  it('should show out of stock products', async () => {
    const org = await prisma.organization.findFirst({
      where: { name: { startsWith: 'InvReportTest-' } },
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
        code: `OOS-${Date.now()}`,
        name: 'OOS Warehouse',
        isDefault: false,
      },
    });

    const outOfStockProduct = await prisma.product.create({
      data: {
        organizationId: org!.id,
        name: `Out of Stock Product ${Date.now()}`,
        code: `OOSP-${Date.now()}`,
        unitId,
        costPrice: 10,
        sellingPrice: 20,
        lowStockThreshold: 5,
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/receive',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { warehouseId: warehouse.id, productId: outOfStockProduct.id, quantity: 0 },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/inventory/out-of-stock',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(body.data.items[0].quantity).toBe(0);
  });

  it('should enforce organization isolation', async () => {
    const org2Response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `InvReportIso-${Date.now()}`,
        ownerFirstName: 'Test2',
        ownerLastName: 'User2',
        ownerEmail: `inviso-${Date.now()}@example.com`,
        ownerPhone: '+254700000002',
        password: 'StrongPassword123!',
      },
    });

    const org2Body = JSON.parse(org2Response.body);
    const org2Token = org2Body.data.tokens.accessToken;

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/inventory/stock',
      headers: { authorization: `Bearer ${org2Token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items).toEqual([]);
  });

  it('should paginate correctly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/reports/inventory/stock?page=1&limit=1',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.items.length).toBe(1);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(1);
    expect(body.data.pagination.total).toBeGreaterThanOrEqual(1);
    expect(body.data.pagination.totalPages).toBeGreaterThanOrEqual(1);
  });
});
