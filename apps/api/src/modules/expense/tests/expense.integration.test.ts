import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Expense integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let categoryId: string;

  beforeAll(async () => {
    app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `ExpTest-${Date.now()}`,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `exptest-${Date.now()}@example.com`,
        ownerPhone: '+254700000000',
        password: 'StrongPassword123!',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    accessToken = registerBody.data.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should create an expense category', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/finance/categories',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        name: 'Office Rent',
        code: 'RENT',
        description: 'Monthly office rent',
        budget: 50000,
      },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    categoryId = body.data.id;
  });

  it('should list expense categories', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/finance/categories',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('should create an expense', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/finance/expenses',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        categoryId,
        amount: 1500,
        description: 'Electricity bill',
        expenseDate: '2025-01-15T00:00:00.000Z',
        paymentReference: 'INV-001',
      },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
  });

  it('should list expenses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/finance/expenses',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('should retrieve an expense by id', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/finance/expenses',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        categoryId,
        amount: 2000,
        description: 'Fuel for delivery',
      },
    });

    const createdId = JSON.parse(createResponse.body).data.id;

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/finance/expenses/${createdId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.amount).toBe(2000);
    expect(body.data.categoryName).toBe('Office Rent');
  });
});
