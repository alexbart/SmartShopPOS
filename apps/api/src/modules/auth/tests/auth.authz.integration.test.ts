import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL = 'postgresql://postgres:admin@localhost:5432/smartshop';
process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-long-enough-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-that-is-long-enough-for-testing';

describe('Auth auth lifecycle', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  const registerAndLogin = async () => {
    const uniqueName = `SmartShop Test ${Date.now()}`;
    const email = `alex-${Date.now()}@smartshop.test`;

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: uniqueName,
        ownerFirstName: 'Alex',
        ownerLastName: 'Kiprop',
        ownerEmail: email,
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
        email,
        password: 'StrongPassword123!',
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    const loginBody = JSON.parse(loginResponse.body);

    return {
      organizationCode,
      email,
      accessToken: loginBody.data.tokens.accessToken,
      refreshToken: loginBody.data.tokens.refreshToken,
    };
  };

  it('returns current user via /me', async () => {
    const { accessToken, email } = await registerAndLogin();

    const meResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(meResponse.statusCode).toBe(200);
    const body = JSON.parse(meResponse.body);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.email).toBe(email);
    expect(body.data.roles).toEqual(expect.any(Array));
    expect(body.data.organization).toBeDefined();
    expect(body.data.branch).toBeDefined();
  });

  it('refreshes tokens via /refresh', async () => {
    const { refreshToken } = await registerAndLogin();

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken,
      },
    });

    expect(refreshResponse.statusCode).toBe(200);
    const body = JSON.parse(refreshResponse.body);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(body.data.refreshToken).not.toBe(refreshToken);
  });

  it('returns 401 for invalid refresh token', async () => {
    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken: 'invalid.token.here',
      },
    });

    expect(refreshResponse.statusCode).toBe(401);
  });

  it('returns 401 for me without token', async () => {
    const meResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(meResponse.statusCode).toBe(401);
  });

  it('logs out via /logout', async () => {
    const { refreshToken } = await registerAndLogin();

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: {
        refreshToken,
      },
    });

    expect(logoutResponse.statusCode).toBe(204);

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refreshToken,
      },
    });

    expect(refreshResponse.statusCode).toBe(401);
  });

  it('returns 204 for logout with invalid token', async () => {
    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: {
        refreshToken: 'invalid.token.here',
      },
    });

    expect(logoutResponse.statusCode).toBe(204);
  });
});
