import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Cash Drawer integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let drawerSessionId: string;

  beforeAll(async () => {
    app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `CashTest-${Date.now()}`,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `cashtest-${Date.now()}@example.com`,
        ownerPhone: '+254700000000',
        password: 'StrongPassword123!',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    accessToken = registerBody.data.tokens.accessToken;

    const branch = await prisma.branch.findFirst({
      where: { organizationId: registerBody.data.organization.id },
      select: { id: true },
    });
    void branch;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should open a cash drawer', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/cash-drawers/open',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        openingFloat: 5000,
      },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.session).toBeDefined();
    expect(body.data.session.status).toBe('OPEN');
    expect(Number(body.data.session.openingFloat)).toBe(5000);
    expect(Number(body.data.session.expectedCash)).toBe(5000);

    drawerSessionId = body.data.session.id;
  });

  it('should prevent opening a second drawer when one is already open', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/cash-drawers/open',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        openingFloat: 5000,
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should add cash in to the current session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/cash-drawers/${drawerSessionId}/cash-in`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        amount: 2000,
        notes: 'Owner deposit',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).success).toBe(true);

    const current = await app.inject({
      method: 'GET',
      url: '/api/v1/cash-drawers/current',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const body = JSON.parse(current.body);
    expect(Number(body.data.session.expectedCash)).toBe(7000);
    expect(Number(body.data.session.totalCashIn)).toBe(2000);
  });

  it('should add cash out from the current session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/cash-drawers/${drawerSessionId}/cash-out`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        amount: 500,
        notes: 'Petty cash payout',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).success).toBe(true);

    const current = await app.inject({
      method: 'GET',
      url: '/api/v1/cash-drawers/current',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const body = JSON.parse(current.body);
    expect(Number(body.data.session.expectedCash)).toBe(6500);
    expect(Number(body.data.session.totalCashOut)).toBe(500);
  });

  it('should close the cash drawer with a variance', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/cash-drawers/${drawerSessionId}/close`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        countedCash: 6350,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.session.status).toBe('CLOSED');
    expect(body.data.session.countedCash).toBe(6350);
    expect(body.data.session.variance).toBe(-150);
    expect(Number(body.data.session.expectedCash)).toBe(6500);
  });

  it('should prevent closing an already-closed session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/cash-drawers/${drawerSessionId}/close`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        countedCash: 5000,
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should retrieve movements for a session', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/cash-drawers/${drawerSessionId}/movements`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((m: { type: string }) => m.type === 'OPENING_FLOAT')).toBe(true);
    expect(body.data.some((m: { type: string }) => m.type === 'CASH_IN')).toBe(true);
    expect(body.data.some((m: { type: string }) => m.type === 'CASH_OUT')).toBe(true);
    expect(body.data.some((m: { type: string }) => m.type === 'CLOSING')).toBe(true);
  });
});
