import 'reflect-metadata';
import { describe, expect, it, beforeAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Product integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let unitId: string;

  beforeAll(async () => {
    app = await buildApp();

    const orgName = `ProductTest-${Date.now()}`;
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: orgName,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `producttest-${Date.now()}@example.com`,
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

    if (org) {
      const unit = await prisma.unit.create({
        data: {
          organizationId: org.id,
          code: 'TEST',
          name: 'Test Unit',
          abbreviation: 'tu',
        },
      });
      unitId = unit.id;
    }
  });

  it('should create and list products', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: 'Test Product',
        code: 'TP001',
        unitId: unitId,
        costPrice: 10,
        sellingPrice: 20,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createBody = JSON.parse(createResponse.body);
    expect(createBody.success).toBe(true);
    expect(createBody.data.code).toBe('TP001');

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/products',
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
