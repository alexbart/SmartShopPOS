import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PurchaseOrderStatuses } from '../../purchase-order/repository/purchase-order.repository.js';

const prisma = new PrismaClient();

describe('Purchase Order integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let organizationId: string;
  let warehouseId: string;
  let productId: string;
  let supplierId: string;
  let branchId: string;

  beforeAll(async () => {
    app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `POTest-${Date.now()}`,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `potest-${Date.now()}@example.com`,
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
    branchId = branch!.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId,
        branchId: branch!.id,
        code: `PO-WH-${Date.now()}`,
        name: 'PO Test Warehouse',
        isDefault: true,
      },
    });
    warehouseId = warehouse.id;

    const unit = await prisma.unit.create({
      data: {
        organizationId,
        code: `PO-UNIT-${Date.now()}`,
        name: 'Unit',
        abbreviation: 'u',
      },
    });

    const product = await prisma.product.create({
      data: {
        organizationId,
        name: 'Test Product',
        code: `PO-PROD-${Date.now()}`,
        sku: 'SKU-PO-001',
        unitId: unit.id,
        costPrice: 50,
        sellingPrice: 100,
        lowStockThreshold: 5,
      },
    });
    productId = product.id;

    const supplier = await prisma.supplier.create({
      data: {
        organizationId,
        code: `PO-SUP-${Date.now()}`,
        name: 'Test Supplier',
        isActive: true,
      },
    });
    supplierId = supplier.id;
  });

  it('should create a purchase order in DRAFT status', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [
          {
            productId,
            quantity: 100,
            unitCost: 50,
            discount: 0,
            tax: 0,
          },
        ],
        notes: 'Test PO',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe(PurchaseOrderStatuses.DRAFT);
    expect(body.data.orderNumber).toMatch(/^PO-/);
    expect(body.data.items.length).toBe(1);
    expect(body.data.totalQuantity).toBe(100);
  });

  it('should retrieve a purchase order by ID', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 50, unitCost: 50 }],
      },
    });

    const created = JSON.parse(createResponse.body);
    const poId = created.data.id;

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/purchase-orders/${poId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.id).toBe(poId);
    expect(body.data.orderNumber).toBe(created.data.orderNumber);
    expect(body.data.items.length).toBe(1);
  });

  it('should submit a draft purchase order', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 30, unitCost: 50 }],
      },
    });

    const poId = JSON.parse(createResponse.body).data.id;

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.status).toBe(PurchaseOrderStatuses.SUBMITTED);
  });

  it('should receive goods and update status to RECEIVED', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 20, unitCost: 50 }],
      },
    });

    const poId = JSON.parse(createResponse.body).data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const receiveResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/receive`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId,
        items: [{ productId, quantity: 20, unitCost: 50 }],
      },
    });

    expect(receiveResponse.statusCode).toBe(200);
    const receiveBody = JSON.parse(receiveResponse.body);
    expect(receiveBody.data.status).toBe(PurchaseOrderStatuses.RECEIVED);
    expect(receiveBody.data.receivedQuantity).toBe(20);

    const stock = await prisma.stock.findFirst({
      where: {
        organizationId,
        warehouseId,
        productId,
      },
    });
    expect(Number(stock?.quantity ?? 0)).toBeGreaterThanOrEqual(20);
  });

  it('should support partial receiving', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 100, unitCost: 50 }],
      },
    });

    const poId = JSON.parse(createResponse.body).data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const partialResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/receive`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId,
        items: [{ productId, quantity: 40, unitCost: 50 }],
      },
    });

    expect(partialResponse.statusCode).toBe(200);
    const partialBody = JSON.parse(partialResponse.body);
    expect(partialBody.data.status).toBe(PurchaseOrderStatuses.PARTIALLY_RECEIVED);

    const finalResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/receive`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId,
        items: [{ productId, quantity: 60, unitCost: 50 }],
      },
    });

    expect(finalResponse.statusCode).toBe(200);
    const finalBody = JSON.parse(finalResponse.body);
    expect(finalBody.data.status).toBe(PurchaseOrderStatuses.RECEIVED);
    expect(finalBody.data.receivedQuantity).toBe(100);
  });

  it('should prevent receiving more than ordered', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 10, unitCost: 50 }],
      },
    });

    const poId = JSON.parse(createResponse.body).data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/receive`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId,
        items: [{ productId, quantity: 20, unitCost: 50 }],
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should cancel a submitted purchase order', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 10, unitCost: 50 }],
      },
    });

    const poId = JSON.parse(createResponse.body).data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/cancel`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should prevent modifying a submitted purchase order', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 10, unitCost: 50 }],
      },
    });

    const poId = JSON.parse(createResponse.body).data.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/purchase-orders/${poId}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { notes: 'Updated note' },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should enforce organization isolation', async () => {
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `POIso-${Date.now()}`,
        ownerFirstName: 'Other',
        ownerLastName: 'User',
        ownerEmail: `poiso-${Date.now()}@example.com`,
        ownerPhone: '+254700000001',
        password: 'StrongPassword123!',
      },
    });

    const otherToken = JSON.parse(registerResponse.body).data.tokens.accessToken;

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 10, unitCost: 50 }],
      },
    });

    const poId = JSON.parse(createResponse.body).data.id;

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/purchase-orders/${poId}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(response.statusCode).toBe(404);
  });
});
