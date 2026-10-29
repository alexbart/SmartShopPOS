import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL = 'postgresql://postgres:admin@localhost:5432/smartshop';
process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-long-enough-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-that-is-long-enough-for-testing';

describe('POST /api/v1/auth/login', () => {
  let app: FastifyInstance;
  const uniqueName = `SmartShop Test ${Date.now()}`;

  beforeAll(async () => {
    app = await buildApp();
  });

  it('returns 200 for valid login', async () => {
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: uniqueName,
        ownerFirstName: 'Alex',
        ownerLastName: 'Kiprop',
        ownerEmail: `alex-${Date.now()}@smartshop.test`,
        ownerPhone: '+254700000001',
        password: 'StrongPassword123!',
      },
    });

    expect(registerResponse.statusCode).toBe(201);
    const registerBody = JSON.parse(registerResponse.body);
    const organizationCode = registerBody.data.organization.code;

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        organizationCode,
        email: registerBody.data.user.email,
        password: 'StrongPassword123!',
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    const body = JSON.parse(loginResponse.body);
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();
  });

  it('returns 401 for invalid password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        organizationCode: 'ORG001',
        email: `alex-${Date.now()}@smartshop.test`,
        password: 'WrongPassword123!',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 for unknown organization', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        organizationCode: 'UNKNOWN',
        email: `alex-${Date.now()}@smartshop.test`,
        password: 'StrongPassword123!',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
