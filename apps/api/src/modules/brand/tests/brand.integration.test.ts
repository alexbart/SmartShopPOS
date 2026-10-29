import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';

describe('Brand integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;

  beforeAll(async () => {
    app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `BrandTest-${Date.now()}`,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `brandtest-${Date.now()}@example.com`,
        ownerPhone: '+254700000000',
        password: 'StrongPassword123!',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    accessToken = registerBody.data.tokens.accessToken;
  });

  it('should create and list brands', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/brands',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: 'Test Brand',
        code: 'TBR001',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createBody = JSON.parse(createResponse.body);
    expect(createBody.success).toBe(true);
    expect(createBody.data.code).toBe('TBR001');

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/brands',
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
