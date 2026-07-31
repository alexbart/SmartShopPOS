import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';

describe('Supplier integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;

  beforeAll(async () => {
    app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `SupplierTest-${Date.now()}`,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `suppliertest-${Date.now()}@example.com`,
        ownerPhone: '+254700000000',
        password: 'StrongPassword123!',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    accessToken = registerBody.data.tokens.accessToken;
  });

  it('should create and list suppliers', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/suppliers',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        code: 'SUP001',
        name: 'Test Supplier',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createBody = JSON.parse(createResponse.body);
    expect(createBody.success).toBe(true);
    expect(createBody.data.code).toBe('SUP001');

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/suppliers',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(listResponse.statusCode).toBe(200);
    const listBody = JSON.parse(listResponse.body);
    expect(listBody.success).toBe(true);
    expect(listBody.data.items.length).toBeGreaterThan(0);
  });
});
