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

  it('lists system roles and enforces a read-only inventory role for its assigned user', async () => {
    const owner = await registerAndLogin();
    const ownerHeaders = { authorization: `Bearer ${owner.accessToken}` };

    const rolesResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/roles',
      headers: ownerHeaders,
    });
    expect(rolesResponse.statusCode).toBe(200);
    const roles = JSON.parse(rolesResponse.body).data.items;
    const cashierRole = roles.find((role: { name: string }) => role.name === 'CASHIER');
    expect(cashierRole?.isSystem).toBe(true);
    expect(
      cashierRole?.permissions
        .filter((p: { name: string }) => p.name.startsWith('inventory:'))
        .map((p: { name: string }) => p.name),
    ).toEqual(['inventory:read']);
    const systemRoleUpdate = await app.inject({
      method: 'PATCH',
      url: `/api/v1/auth/roles/${cashierRole.id}`,
      headers: ownerHeaders,
      payload: { description: 'Should not change system role' },
    });
    expect(systemRoleUpdate.statusCode).toBe(403);

    const meResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: ownerHeaders,
    });
    const ownerBranchId = JSON.parse(meResponse.body).data.branch.id;
    const permissionsResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/permissions',
      headers: ownerHeaders,
    });
    const inventoryReadId = JSON.parse(permissionsResponse.body).data.find(
      (p: { name: string }) => p.name === 'inventory:read',
    )?.id;
    expect(inventoryReadId).toBeDefined();

    const roleResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/roles',
      headers: ownerHeaders,
      payload: { name: `Read Only ${Date.now()}`, permissionIds: [inventoryReadId] },
    });
    expect(roleResponse.statusCode).toBe(201);
    const roleId = JSON.parse(roleResponse.body).data.id;

    const cashierEmail = `cashier-${Date.now()}@smartshop.test`;
    const createUserResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/users',
      headers: ownerHeaders,
      payload: {
        firstName: 'Test',
        lastName: 'Cashier',
        email: cashierEmail,
        password: 'CashierPassword123!',
        roleId,
        branchId: ownerBranchId,
      },
    });
    expect(createUserResponse.statusCode).toBe(201);

    const assignedRoleDelete = await app.inject({
      method: 'DELETE',
      url: `/api/v1/auth/roles/${roleId}`,
      headers: ownerHeaders,
    });
    expect(assignedRoleDelete.statusCode).toBe(409);

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        organizationCode: owner.organizationCode,
        email: cashierEmail,
        password: 'CashierPassword123!',
      },
    });
    expect(loginResponse.statusCode).toBe(200);
    const cashierToken = JSON.parse(loginResponse.body).data.tokens.accessToken;
    const cashierHeaders = { authorization: `Bearer ${cashierToken}` };

    const inventoryRead = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/movements',
      headers: cashierHeaders,
    });
    expect(inventoryRead.statusCode).toBe(200);

    const stockAdjustment = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/adjust',
      headers: cashierHeaders,
      payload: {
        warehouseId: '00000000-0000-4000-8000-000000000001',
        productId: '00000000-0000-4000-8000-000000000002',
        quantity: 1,
        type: 'ADJUSTMENT',
        remarks: 'Authorization check',
      },
    });
    expect(stockAdjustment.statusCode).toBe(403);

    const stockTransfer = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/transfer',
      headers: cashierHeaders,
      payload: {},
    });
    expect(stockTransfer.statusCode).toBe(403);
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
