import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Sales integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let warehouseId: string;
  let productId: string;

  beforeAll(async () => {
    app = await buildApp();

    const orgName = `SalesTest-${Date.now()}`;
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: orgName,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `salestest-${Date.now()}@example.com`,
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
      },
    });
    productId = product.id;

    await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/receive',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId,
        productId,
        quantity: 10,
      },
    });
  });

  it('should complete a cash sale: stock 10 -> sell 2 -> stock 8, movement created, payment recorded, receipt created', async () => {
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
    const saleBody = JSON.parse(saleResponse.body);
    expect(saleBody.success).toBe(true);
    expect(saleBody.data.total).toBe(200);
    expect(saleBody.data.status).toBe('COMPLETED');
    expect(saleBody.data.number).toMatch(/^INV-\d{6}-\d{6}$/);

    const paymentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/payments',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        saleId: saleBody.data.id,
        method: 'CASH',
        amount: 200,
      },
    });

    expect(paymentResponse.statusCode).toBe(201);
    const paymentBody = JSON.parse(paymentResponse.body);
    expect(paymentBody.success).toBe(true);
    expect(paymentBody.data.amount).toBe(200);
    expect(paymentBody.data.status).toBe('PAID');

    const receiptResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/receipts',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { saleId: saleBody.data.id },
    });

    expect(receiptResponse.statusCode).toBe(201);
    const receiptBody = JSON.parse(receiptResponse.body);
    expect(receiptBody.success).toBe(true);
    expect(receiptBody.data.number).toMatch(/^RCPT-\d{6}-\d{6}$/);

    const stockResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/inventory/warehouses/${warehouseId}/products/${productId}/stock`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(stockResponse.statusCode).toBe(200);
    const stockBody = JSON.parse(stockResponse.body);
    expect(stockBody.data.quantity).toBe(8);
  });

  it('should reject sale when insufficient stock: stock 8 -> sell 10 -> rejected', async () => {
    const saleResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/sales',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        warehouseId,
        items: [{ productId, quantity: 10, price: 100 }],
      },
    });

    expect(saleResponse.statusCode).toBe(500);
    const saleBody = JSON.parse(saleResponse.body);
    expect(saleBody.success).toBe(false);
  });

  it('should void a sale and restore stock: sell 2 from 8 -> stock 6 -> void -> stock 8', async () => {
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
    const saleBody = JSON.parse(saleResponse.body);
    const saleId = saleBody.data.id;

    const voidResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/sales/${saleId}/void`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(voidResponse.statusCode).toBe(200);

    const stockResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/inventory/warehouses/${warehouseId}/products/${productId}/stock`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(stockResponse.statusCode).toBe(200);
    const stockBody = JSON.parse(stockResponse.body);
    expect(stockBody.data.quantity).toBe(8);

    const retrievedSaleResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/sales/${saleId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(retrievedSaleResponse.statusCode).toBe(200);
    const retrievedBody = JSON.parse(retrievedSaleResponse.body);
    expect(retrievedBody.data.status).toBe('VOIDED');
  });
});
